import { TSESTree } from "@typescript-eslint/utils";
import { isCallExpression, isIdentifierWithName } from "./estree-utils";

export const isCreateMachineFactory = (node: TSESTree.Node): boolean =>
  isCallExpression(node) &&
  (isIdentifierWithName("createMachine")(node.callee) ||
    isIdentifierWithName("createTestMachine")(node.callee));

export const hasCreateMachineFactoryAncestor = (ancestors: TSESTree.Node[]) => {
  return ancestors.some((ancestor) => isCreateMachineFactory(ancestor));
};
