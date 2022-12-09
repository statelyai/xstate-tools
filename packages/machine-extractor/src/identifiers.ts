import traverse from '@babel/traverse';
import * as t from '@babel/types';
import { createParser } from './createParser';
import { AnyParser } from './types';
import { unionType } from './unionType';
import {
  getPropertiesOfObjectExpression,
  parserFromBabelMatcher,
} from './utils';
import { wrapParserResult } from './wrapParserResult';

/**
 * Finds a declarator in the same file which corresponds
 * to an identifier of the name you provide
 */
export const findVariableDeclaratorWithName = (
  file: any,
  name: string,
): t.VariableDeclarator | null | undefined => {
  let declarator: t.VariableDeclarator | null | undefined = null;

  traverse(file, {
    VariableDeclarator(path) {
      if (t.isIdentifier(path.node.id) && path.node.id.name === name) {
        declarator = path.node as any;
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
  parser: AnyParser<Result>,
) => {
  return createParser({
    babelMatcher: t.isIdentifier,
    parseNode: (node, context) => {
      const variableDeclarator = findVariableDeclaratorWithName(
        context.file,
        node.name,
      );

      return parser.parse(variableDeclarator?.init, context);
    },
  });
};

/**
 * Finds a declarator in the same file which corresponds
 * to an identifier of the name you provide
 */
export const findTSEnumDeclarationWithName = (
  file: any,
  name: string,
): t.TSEnumDeclaration | null | undefined => {
  let declarator: t.TSEnumDeclaration | null | undefined = null;

  traverse(file, {
    TSEnumDeclaration(path) {
      if (t.isIdentifier(path.node.id) && path.node.id.name === name) {
        declarator = path.node as any;
      }
    },
  });

  return declarator;
};

interface DeepMemberExpression {
  child: DeepMemberExpression | undefined;
  node: t.MemberExpression | t.Identifier;
}

const deepMemberExpressionToPath = (
  memberExpression: DeepMemberExpression,
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

const deepMemberExpression = createParser({
  babelMatcher(node): node is t.MemberExpression | t.Identifier {
    return t.isIdentifier(node) || t.isMemberExpression(node);
  },
  parseNode: (
    node: t.MemberExpression | t.Identifier,
    context,
  ): DeepMemberExpression => {
    return {
      node,
      child:
        'object' in node
          ? deepMemberExpression.parse(node.object, context)
          : undefined,
    };
  },
});

export const objectExpressionWithDeepPath = <Result>(
  path: string[],
  parser: AnyParser<Result>,
) =>
  createParser({
    babelMatcher: t.isObjectExpression,
    parseNode: (node, context) => {
      let currentIndex = 0;
      let currentNode: t.Node | undefined = node;

      while (path[currentIndex]) {
        const pathSection = path[currentIndex];

        const objectProperties = getPropertiesOfObjectExpression(
          currentNode as any,
          context,
        );

        currentNode = (
          objectProperties.find(
            (property) =>
              property.key === pathSection && t.isObjectProperty(property.node),
          )?.node as t.ObjectProperty
        )?.value;

        currentIndex++;
      }

      return parser.parse(currentNode, context);
    },
  });

const getRootIdentifierOfDeepMemberExpression = (
  deepMemberExpression: DeepMemberExpression | undefined,
): t.Identifier | undefined => {
  if (!deepMemberExpressionToPath) return undefined;
  if (t.isIdentifier(deepMemberExpression?.node)) {
    return deepMemberExpression?.node;
  }
  return getRootIdentifierOfDeepMemberExpression(deepMemberExpression?.child);
};

export const memberExpressionReferencingObjectExpression = <Result>(
  parser: AnyParser<Result>,
) =>
  createParser({
    babelMatcher: t.isMemberExpression,
    parseNode: (node, context) => {
      const result = deepMemberExpression.parse(node, context);

      const rootIdentifier = getRootIdentifierOfDeepMemberExpression(result);

      if (!result) return undefined;

      const path = deepMemberExpressionToPath(result);

      return identifierReferencingVariableDeclaration(
        objectExpressionWithDeepPath(path.slice(1), parser),
      ).parse(rootIdentifier, context);
    },
  });

export const memberExpressionReferencingEnumMember = createParser({
  babelMatcher: t.isMemberExpression,
  parseNode: (node, context) => {
    const result = deepMemberExpression.parse(node, context);

    const rootIdentifier = getRootIdentifierOfDeepMemberExpression(result);

    if (!result) return undefined;

    const path = deepMemberExpressionToPath(result);

    const foundEnum = findTSEnumDeclarationWithName(
      context.file,
      rootIdentifier?.name!,
    );

    if (!foundEnum) return undefined;

    const targetEnumMember = path[1];

    const valueParser = unionType([
      wrapParserResult(
        parserFromBabelMatcher(t.isStringLiteral),
        (node) => node.value,
      ),
      wrapParserResult(
        parserFromBabelMatcher(t.isIdentifier),
        (node) => node.name,
      ),
    ]);

    const memberIndex = foundEnum.members.findIndex((member) => {
      const value = valueParser.parse(member.id, context);

      return value === targetEnumMember;
    });

    const member = foundEnum.members[memberIndex];

    if (!member) {
      return undefined;
    }

    if (member?.initializer) {
      return {
        node: member,
        value: unionType<string>([
          wrapParserResult(
            parserFromBabelMatcher(t.isStringLiteral),
            (node) => node.value,
          ),
          wrapParserResult(parserFromBabelMatcher(t.isNumericLiteral), (node) =>
            String(node.value),
          ),
        ]).parse(member.initializer, context) as string,
      };
    } else {
      return {
        node: member,
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
