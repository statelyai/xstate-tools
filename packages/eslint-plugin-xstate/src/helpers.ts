import { TSESLint, TSESTree } from "@typescript-eslint/utils";
import { isCallExpression, isIdentifierWithName } from "./estree-utils";

export const findPrevTokenMatching = (
  node: TSESTree.Node,
  sourceCode: Readonly<TSESLint.SourceCode>,
  match: string[]
): TSESTree.Token | null => {
  let prevToken = sourceCode.getTokenBefore(node);

  while (prevToken && !match.includes(prevToken.value)) {
    prevToken = sourceCode.getTokenBefore(prevToken)!;
  }

  return prevToken && match.includes(prevToken.value) ? prevToken : null;
};

export const isCreateMachineFactory = (node: TSESTree.Node): boolean =>
  isCallExpression(node) &&
  (isIdentifierWithName("createMachine")(node.callee) ||
    isIdentifierWithName("createTestMachine")(node.callee));

export const hasCreateMachineFactoryAncestor = (ancestors: TSESTree.Node[]) => {
  return ancestors.some((ancestor) => isCreateMachineFactory(ancestor));
};
