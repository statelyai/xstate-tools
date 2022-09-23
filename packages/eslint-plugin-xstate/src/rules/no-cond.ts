import { ESLintUtils, TSESTree } from "@typescript-eslint/utils";
import {
  isIdentifierWithName,
  isObjectExpression,
  isProperty,
} from "../estree-utils";
import { hasCreateMachineFactoryAncestor } from "../helpers";

const isOnIdentifier = isIdentifierWithName("on");
const isCondIdentifier = isIdentifierWithName("cond");

const hasOnPropertyAncestor = (ancestors: TSESTree.Node[]) => {
  return ancestors
    .reverse()
    .some(
      (ancestor) =>
        isObjectExpression(ancestor) &&
        isProperty(ancestor.parent) &&
        isOnIdentifier(ancestor.parent.key)
    );
};

const createRule = ESLintUtils.RuleCreator((name) => name);

const rule = createRule({
  create(context) {
    return {
      Property(node) {
        const ancestors = context.getAncestors();

        if (
          isCondIdentifier(node.key) &&
          hasCreateMachineFactoryAncestor(ancestors) &&
          hasOnPropertyAncestor(ancestors)
        ) {
          context.report({
            node,
            messageId: "renameCond",
            fix: (fixer) => fixer.replaceText(node.key, "guard"),
          });
        }
      },
    };
  },
  name: "no-cond",
  meta: {
    type: "problem",
    fixable: "code",
    docs: {
      description: "replace `cond` identifier with `guard`",
      recommended: "error",
    },
    messages: {
      renameCond: 'Rename identifier "cond" to "guard"',
    },
    schema: [],
  },
  defaultOptions: [],
});

export default rule;
