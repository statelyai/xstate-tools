import { ESLintUtils, TSESTree } from "@typescript-eslint/utils";
import {
  isCallExpression,
  isIdentifier,
  isIdentifierWithName,
  isMemberExpression,
} from "../estree-utils";
import { findPrevTokenMatching } from "../helpers";

const isContextIdentifier = isIdentifierWithName("context");
const isWithContextIdentifier = isIdentifierWithName("withContext");

const findContextMemberExpressionArgument = (node: TSESTree.SpreadElement) => {
  return (
    isMemberExpression(node.argument) &&
    isContextIdentifier(node.argument.property) &&
    node.argument
  );
};

const findClosestCallExpression = (ancestors: TSESTree.Node[]) => {
  return ancestors
    .reverse()
    .find((ancestor): ancestor is TSESTree.CallExpression =>
      isCallExpression(ancestor)
    );
};

const isWithContextCallExpression = (
  node: TSESTree.CallExpression
): node is TSESTree.CallExpression & {
  callee: TSESTree.MemberExpression;
} => {
  return (
    isMemberExpression(node.callee) &&
    isWithContextIdentifier(node.callee.property)
  );
};

const hasMatchingObjectIdentifier = (
  node1: TSESTree.MemberExpression,
  node2: TSESTree.MemberExpression
) => {
  return (
    isIdentifier(node1.object) &&
    isIdentifier(node2.object) &&
    node1.object.name === node2.object.name
  );
};

const createRule = ESLintUtils.RuleCreator((name) => name);

const rule = createRule({
  create(context) {
    const sourceCode = context.getSourceCode();

    return {
      SpreadElement(node) {
        const ancestors = context.getAncestors();

        const contextArgument = findContextMemberExpressionArgument(node);
        const parentCallExpression = findClosestCallExpression(ancestors);

        if (
          !contextArgument ||
          !parentCallExpression ||
          !isWithContextCallExpression(parentCallExpression) ||
          !hasMatchingObjectIdentifier(
            contextArgument,
            parentCallExpression.callee
          )
        ) {
          return;
        }

        context.report({
          node,
          messageId: "avoidSpread",
          fix(fixer) {
            const prevToken = findPrevTokenMatching(node, sourceCode, [
              ",",
              "{",
            ]);

            let lastToken = sourceCode.getTokenAfter(node);
            if (lastToken?.value !== ",") {
              lastToken = sourceCode.getTokenBefore(lastToken!);
            }

            const start = prevToken?.range[1] ?? node.loc.start.line;
            const end = lastToken?.range[1] ?? node.loc.end.line;

            return fixer.removeRange([start, end]);
          },
        });
      },
    };
  },
  name: "avoid-context-spread",
  meta: {
    type: "problem",
    fixable: "code",
    messages: {
      avoidSpread:
        "`withContext` accepts partial `context`—no need to spread `machine.context`",
    },
    docs: {
      description:
        "Since `machine.withContext` now permits partial context, no need to spread `machine.context`",
      recommended: "warn",
    },
    schema: [],
  },
  defaultOptions: [],
});

export default rule;
