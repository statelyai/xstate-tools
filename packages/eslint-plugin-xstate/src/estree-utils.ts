import { ASTUtils, AST_NODE_TYPES, TSESTree } from "@typescript-eslint/utils";

const is = <Type extends AST_NODE_TYPES>(type: Type) =>
  ASTUtils.isNodeOfType(type);

export const isCallExpression = is(AST_NODE_TYPES.CallExpression);
export const isIdentifier = is(AST_NODE_TYPES.Identifier);
export const isMemberExpression = is(AST_NODE_TYPES.MemberExpression);
export const isObjectExpression = is(AST_NODE_TYPES.ObjectExpression);
export const isProperty = is(AST_NODE_TYPES.Property);

export const isIdentifierWithName =
  (name: string) =>
  (node: TSESTree.Node): node is TSESTree.Identifier => {
    return isIdentifier(node) && node.name === name;
  };
