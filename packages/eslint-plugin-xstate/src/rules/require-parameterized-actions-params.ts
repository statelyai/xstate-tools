import { ESLintUtils, TSESTree } from "@typescript-eslint/utils";
import { getPropertyName } from "@typescript-eslint/utils/dist/ast-utils";
import { isProperty } from "../estree-utils";
import { hasCreateMachineFactoryAncestor } from "../helpers";

interface ParameterizedActionParamProperty extends TSESTree.ObjectExpression {
  key: {
    name: string;
  };
}

const createRule = ESLintUtils.RuleCreator((name) => name);

const isParameterizedActionParamProperty = (
  node: TSESTree.Node
): node is ParameterizedActionParamProperty => {
  return (
    isProperty(node) &&
    getPropertyName(node) !== "type" &&
    getPropertyName(node) !== "params"
  );
};

const propertyKey = "Property[key.name=/action|entry|exit/]";
const propertyWithObject = `${propertyKey} > ObjectExpression`;
const propertyWithArrayOfObjects = `${propertyKey} > ArrayExpression > ObjectExpression`;

const rule = createRule({
  create(context) {
    return {
      [`${propertyWithObject}, ${propertyWithArrayOfObjects}`](
        node: TSESTree.ObjectExpression
      ) {
        const ancestors = context.getAncestors();
        if (!hasCreateMachineFactoryAncestor(ancestors)) {
          return;
        }

        const params: ParameterizedActionParamProperty[] = [];
        for (const property of node.properties) {
          if (isParameterizedActionParamProperty(property)) {
            params.push(property);
          }
        }

        if (params.length > 0) {
          context.report({
            node,
            messageId: "moveActionParamsIntoParamsObject",
            data: {
              keys: params.map((param) => param.key.name).join(", "),
            },
          });
        }
      },
    };
  },
  name: "require-parameterized-actions-params",
  meta: {
    type: "problem",
    docs: {
      description:
        "Require parameterized action objects params to be in a `params` object",
      recommended: "error",
    },
    messages: {
      moveActionParamsIntoParamsObject:
        "Move keys [{{ keys }}] into an object at the `params` key",
    },
    schema: [],
  },
  defaultOptions: [],
});

export default rule;
