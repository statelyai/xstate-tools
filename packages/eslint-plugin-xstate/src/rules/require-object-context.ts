import { ESLintUtils, TSESTree } from "@typescript-eslint/utils";
import { isObjectExpression } from "../estree-utils";
import { isCreateMachineFactory } from "../helpers";

const createRule = ESLintUtils.RuleCreator((name) => name);

const rule = createRule({
  create(context) {
    return {
      'Property[key.name="context"][value.type!="ObjectExpression"]'(
        node: TSESTree.Property
      ) {
        if (
          isObjectExpression(node.parent) &&
          isCreateMachineFactory(node.parent.parent)
        ) {
          context.report({
            node: node.value,
            messageId: "mustUseContextObject",
          });
        }
      },
    };
  },
  name: "require-object-context",
  meta: {
    type: "problem",
    docs: {
      description: "Require `machine.context` to be an `object`",
      recommended: "error",
    },
    messages: {
      mustUseContextObject: "`context` must be an `object`",
    },
    schema: [],
  },
  defaultOptions: [],
});

export default rule;
