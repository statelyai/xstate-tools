import { parse } from '@babel/parser';
import traverse from '@babel/traverse';
import * as t from '@babel/types';
import { ALLOWED_CALL_EXPRESSION_NAMES } from './machineCallExpression';

export const getMachineNodesFromFile = (fileContent: string) => {
  const file = parse(fileContent, {
    sourceType: 'module',
    plugins: [
      'typescript',
      'jsx',
      ['decorators', { decoratorsBeforeExport: false }],
    ],
    // required by recast
    tokens: true,
  });

  const machineNodes: Array<t.CallExpression> = [];

  traverse(file, {
    CallExpression(path) {
      const node = path.node;
      if (
        t.isMemberExpression(node.callee) &&
        t.isIdentifier(node.callee.property) &&
        ALLOWED_CALL_EXPRESSION_NAMES.includes(node.callee.property.name)
      ) {
        machineNodes.push(node);
      }

      if (
        t.isIdentifier(node.callee) &&
        ALLOWED_CALL_EXPRESSION_NAMES.includes(node.callee.name)
      ) {
        machineNodes.push(node);
      }
    },
  });

  return {
    file,
    machineNodes,
  };
};
