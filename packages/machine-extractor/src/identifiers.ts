import { NodePath, traverse, types as t } from "@babel/core";
import { createParser } from "./createParser";
import { AnyParser, Parser } from "./types";
import { unionType } from "./unionType";
import {
  getPropertiesOfObjectExpression,
  parserFromBabelMatcher,
} from "./utils";
import { wrapParserResult } from "./wrapParserResult";

/**
 * Finds a declarator in the same file which corresponds
 * to an identifier of the name you provide
 */
export const findVariableDeclaratorWithName = (
  file: any,
  name: string
): NodePath<t.VariableDeclarator> | null | undefined => {
  let declarator: NodePath<t.VariableDeclarator> | null | undefined = null;

  traverse(file, {
    VariableDeclarator(path) {
      if (t.isIdentifier(path.node.id) && path.node.id.name === name) {
        declarator = path as any;
      }
    },
  });

  return declarator;
};

/**
 * Used for when you expect an identifier to be used
 * which references a variable declaration of a certain type
 */
export const identifierReferencingVariableDeclaration = <Result>(
  parser: AnyParser<Result>
) => {
  return createParser({
    babelMatcher: t.isIdentifier,
    parsePath: (path, context) => {
      const variableDeclarator = findVariableDeclaratorWithName(
        context.file,
        path.node.name
      );

      return parser.parse(variableDeclarator?.get("init"), context);
    },
  });
};

/**
 * Finds a declarator in the same file which corresponds
 * to an identifier of the name you provide
 */
export const findTSEnumDeclarationWithName = (
  file: any,
  name: string
): NodePath<t.TSEnumDeclaration> | null | undefined => {
  let declarator: NodePath<t.TSEnumDeclaration> | null | undefined = null;

  traverse(file, {
    TSEnumDeclaration(path) {
      if (t.isIdentifier(path.node.id) && path.node.id.name === name) {
        declarator = path as any;
      }
    },
  });

  return declarator;
};

interface DeepMemberExpression {
  child?: DeepMemberExpression;
  node: t.MemberExpression | t.Identifier;
  path: NodePath<t.MemberExpression | t.Identifier>;
}

const deepMemberExpressionToPath = (
  memberExpression: DeepMemberExpression
): string[] => {
  let currentLevel: DeepMemberExpression | undefined = memberExpression;
  const path: string[] = [];

  while (currentLevel) {
    if (t.isIdentifier(currentLevel.node)) {
      path.push(currentLevel.node.name);
    } else if (
      t.isMemberExpression(currentLevel.node) &&
      t.isIdentifier(currentLevel.node.property)
    ) {
      path.push(currentLevel.node.property.name);
    }
    currentLevel = currentLevel.child;
  }

  return path.reverse();
};

const deepMemberExpression: Parser<
  t.MemberExpression | t.Identifier,
  DeepMemberExpression
> = createParser({
  babelMatcher(node): node is t.MemberExpression | t.Identifier {
    return t.isIdentifier(node) || t.isMemberExpression(node);
  },
  parsePath: (path, context) => {
    const child = path.get("object") as unknown as NodePath<
      t.MemberExpression | t.Identifier
    >;
    return {
      path,
      node: path.node,
      child: child ? deepMemberExpression.parse(child, context) : undefined,
    };
  },
});

export const objectExpressionWithDeepPath = <Result>(
  objPath: string[],
  parser: AnyParser<Result>
) =>
  createParser({
    babelMatcher: t.isObjectExpression,
    parsePath: (path, context) => {
      let currentIndex = 0;
      let currentPath: NodePath<t.ObjectExpression> | undefined | null = path;

      while (objPath[currentIndex]) {
        const pathSection = objPath[currentIndex];

        const objectProperties = getPropertiesOfObjectExpression(
          currentPath,
          context
        );

        currentPath = (
          objectProperties.find(
            (property) =>
              property.key === pathSection && t.isObjectProperty(property.node)
          )?.path as NodePath<t.ObjectProperty>
        ).get("value") as any;

        currentIndex++;
      }

      return parser.parse(currentPath, context);
    },
  });

const getRootIdentifierOfDeepMemberExpression = (
  deepMemberExpression: DeepMemberExpression | undefined
): NodePath<t.Identifier> | undefined => {
  if (!deepMemberExpressionToPath) return undefined;
  if (t.isIdentifier(deepMemberExpression?.path.node)) {
    return deepMemberExpression?.path as NodePath<t.Identifier>;
  }
  return getRootIdentifierOfDeepMemberExpression(deepMemberExpression?.child);
};

export const memberExpressionReferencingObjectExpression = <Result>(
  parser: AnyParser<Result>
) =>
  createParser({
    babelMatcher: t.isMemberExpression,
    parsePath: (path, context) => {
      const result = deepMemberExpression.parse(path, context);

      const rootIdentifier = getRootIdentifierOfDeepMemberExpression(result);

      if (!result) return undefined;

      const memberPath = deepMemberExpressionToPath(result);

      return identifierReferencingVariableDeclaration(
        objectExpressionWithDeepPath(memberPath.slice(1), parser)
      ).parse(rootIdentifier, context);
    },
  });

export const memberExpressionReferencingEnumMember = createParser({
  babelMatcher: t.isMemberExpression,
  parsePath: (path, context) => {
    const result = deepMemberExpression.parse(path, context);

    const rootIdentifier = getRootIdentifierOfDeepMemberExpression(result);

    if (!result) return undefined;

    const stringPath = deepMemberExpressionToPath(result);

    const foundEnum = findTSEnumDeclarationWithName(
      context.file,
      rootIdentifier?.node.name!
    );

    if (!foundEnum) return undefined;

    const targetEnumMember = stringPath[1];

    const valueParser = unionType([
      wrapParserResult(
        parserFromBabelMatcher(t.isStringLiteral),
        (path) => path.node.value
      ),
      wrapParserResult(
        parserFromBabelMatcher(t.isIdentifier),
        (path) => path.node.name
      ),
    ]);

    const memberIndex = foundEnum.get("members").findIndex((member) => {
      const value = valueParser.parse(member.get("id"), context);

      return value === targetEnumMember;
    });

    const memberPath = foundEnum.get("members")[memberIndex];

    if (!memberPath) {
      return undefined;
    }

    if (memberPath.get("initializer")?.node) {
      return {
        path: memberPath,
        node: memberPath.node,
        value: unionType<string>([
          wrapParserResult(
            parserFromBabelMatcher(t.isStringLiteral),
            (path) => path.node.value
          ),
          wrapParserResult(parserFromBabelMatcher(t.isNumericLiteral), (path) =>
            String(path.node.value)
          ),
        ]).parse(memberPath.get("initializer"), context) as string,
      };
    } else {
      return {
        path: memberPath,
        node: memberPath.node,
        value: String(memberIndex),
      };
    }
  },
});

export const maybeIdentifierTo = <Result>(parser: AnyParser<Result>) => {
  return unionType([
    parser,
    identifierReferencingVariableDeclaration(parser),
    memberExpressionReferencingObjectExpression(parser),
  ]);
};
