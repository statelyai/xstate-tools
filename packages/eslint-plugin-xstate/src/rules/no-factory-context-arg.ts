import { ESLintUtils } from "@typescript-eslint/utils";
import { isCreateMachineFactory } from "../helpers";

const createRule = ESLintUtils.RuleCreator((name) => name);

const rule = createRule({
  create(context) {
    return {
      CallExpression(node) {
        if (isCreateMachineFactory(node) && node.arguments.length === 3) {
          const argumentNode = node.arguments[2];

          context.report({
            node: argumentNode,
            messageId: "removeContextArg",
          });
        }
      },
    };
  },
  name: "no-cond",
  meta: {
    type: "problem",
    docs: {
      description: "`createMachine` accepts only two arguments",
      recommended: "error",
    },
    messages: {
      removeContextArg:
        "Move the `context` definition into `machine.context` or use `machine.withContext`",
    },
    schema: [],
  },
  defaultOptions: [],
});

export default rule;
