import { ESLintUtils, TSESTree } from "@typescript-eslint/utils";
import { getPropertyName } from "@typescript-eslint/utils/dist/ast-utils";
import { isProperty } from "../estree-utils";
import { hasCreateMachineFactoryAncestor } from "../helpers";

interface ParameterizedGuardParamProperty extends TSESTree.ObjectExpression {
  key: {
    name: string;
  };
}

const createRule = ESLintUtils.RuleCreator((name) => name);

const isParameterizedGuardParamProperty = (
  node: TSESTree.Node
): node is ParameterizedGuardParamProperty => {
  return (
    isProperty(node) &&
    getPropertyName(node) !== "type" &&
    getPropertyName(node) !== "params"
  );
};

const rule = createRule({
  create(context) {
    return {
      'Property[key.name="guard"][value.type="ObjectExpression"] > ObjectExpression'(
        node: TSESTree.ObjectExpression
      ) {
        const ancestors = context.getAncestors();
        if (!hasCreateMachineFactoryAncestor(ancestors)) {
          return;
        }

        const params: ParameterizedGuardParamProperty[] = [];
        for (const property of node.properties) {
          if (isParameterizedGuardParamProperty(property)) {
            params.push(property);
          }
        }

        if (params.length > 0) {
          context.report({
            node,
            messageId: "moveGuardParamsIntoParamsObject",
            data: {
              keys: params.map((param) => param.key.name).join(", "),
            },
          });
        }
      },
    };
  },
  name: "require-parameterized-guards-params",
  meta: {
    type: "problem",
    docs: {
      description:
        "Require parameterized guard objects params to be in a `params` object",
      recommended: "error",
    },
    messages: {
      moveGuardParamsIntoParamsObject:
        "Move keys [{{ keys }}] into an object on the `params` key",
    },
    schema: [],
  },
  defaultOptions: [],
});

export default rule;
