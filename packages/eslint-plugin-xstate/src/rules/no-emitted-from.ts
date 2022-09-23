import {
  AST_NODE_TYPES,
  ESLintUtils,
  TSESLint,
  TSESTree,
} from "@typescript-eslint/utils";

const emittedFrom = "EmittedFrom";
const snapshotFrom = "SnapshotFrom";

const getQualifiedNameReferences = (variable: TSESLint.Scope.Variable) => {
  const identifierReferences = [];

  for (const reference of variable.references) {
    const parent = reference.identifier.parent;

    if (
      parent?.type === AST_NODE_TYPES.TSQualifiedName &&
      parent.right.name === emittedFrom
    ) {
      identifierReferences.push(parent.right);
    }
  }

  return identifierReferences;
};

function fixEmittedFromImportSpecifier(
  node: TSESTree.ImportSpecifier,
  variable: TSESLint.Scope.Variable
) {
  return function* (fixer: TSESLint.RuleFixer) {
    if (node.local.name === emittedFrom) {
      // since `node.local` and `node.imported` are both
      // `EmittedFrom`, replace both
      yield fixer.replaceText(node, snapshotFrom);

      // replace references
      for (const reference of variable.references) {
        yield fixer.replaceText(reference.identifier, snapshotFrom);
      }
    } else {
      // just update the imported name
      yield fixer.replaceText(node.imported, snapshotFrom);
    }
  };
}

const createRule = ESLintUtils.RuleCreator((name) => name);

const rule = createRule({
  create(context) {
    const variables: TSESLint.Scope.Variable[] = [];

    return {
      'ImportSpecifier[imported.name="EmittedFrom"], ImportNamespaceSpecifier[parent.source.value="xstate"]'(
        node: TSESTree.ImportSpecifier | TSESTree.ImportNamespaceSpecifier
      ) {
        variables.push(...context.getDeclaredVariables(node));
      },
      "Program:exit"(_node) {
        for (const variable of variables) {
          const node = variable.defs[0].node;

          switch (node.type) {
            case AST_NODE_TYPES.ImportSpecifier:
              {
                context.report({
                  node: node.imported,
                  messageId: "replaceEmittedFromImport",
                  fix: fixEmittedFromImportSpecifier(node, variable),
                });
              }
              break;
            case AST_NODE_TYPES.ImportNamespaceSpecifier: {
              for (const identifier of getQualifiedNameReferences(variable)) {
                context.report({
                  node: identifier,
                  messageId: "replaceEmittedFromQualifiedIdentifier",
                  fix(fixer) {
                    return fixer.replaceText(identifier, snapshotFrom);
                  },
                });
              }
            }
          }
        }
      },
    };
  },
  name: "no-emitted-from",
  meta: {
    type: "problem",
    fixable: "code",
    messages: {
      replaceEmittedFromImport:
        "Replace imported type `EmittedFrom` with `SnapshotFrom`",
      replaceEmittedFromQualifiedIdentifier:
        "Replace identifier `EmittedFrom` with `SnapshotFrom`",
    },
    docs: {
      description: "Replace uses of `EmittedFrom` with `SnapshotFrom`",
      recommended: "warn",
    },
    schema: [],
  },
  defaultOptions: [],
});

export default rule;
