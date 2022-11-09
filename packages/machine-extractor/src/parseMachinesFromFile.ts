import { parse } from '@babel/parser';
import traverse from '@babel/traverse';
import * as t from '@babel/types';
import {
  ALLOWED_CALL_EXPRESSION_NAMES,
  MachineCallExpression,
} from './machineCallExpression';
import { MachineParseResult } from './MachineParseResult';
import { ParseResult } from './types';
import { hashedId } from './utils';

export const parseMachinesFromFile = (fileContent: string): ParseResult => {
  if (
    !ALLOWED_CALL_EXPRESSION_NAMES.some((name) => fileContent.includes(name))
  ) {
    return {
      machines: [],
      comments: [],
      file: undefined,
    };
  }

  const parseResult = parse(fileContent, {
    sourceType: 'module',
    plugins: [
      'typescript',
      'jsx',
      ['decorators', { decoratorsBeforeExport: false }],
    ],
    // required by recast
    tokens: true,
  });

  let result: ParseResult = {
    machines: [],
    comments: [],
    file: parseResult,
  };

  parseResult.comments?.forEach((comment) => {
    if (comment.value.includes('xstate-ignore-next-line')) {
      result.comments.push({
        node: comment,
        type: 'xstate-ignore-next-line',
      });
    } else if (comment.value.includes('@xstate-layout')) {
      result.comments.push({
        node: comment,
        type: 'xstate-layout',
      });
    }
  });

  const getNodeHash = (node: t.Node): string => {
    const fileText = fileContent.substring(node.start!, node.end!);
    return hashedId(fileText);
  };

  traverse(parseResult as any, {
    CallExpression(path) {
      const ast = MachineCallExpression.parse(path.node as any, {
        file: parseResult,
        getNodeHash: getNodeHash,
      });
      if (ast) {
        result.machines.push(
          new MachineParseResult({
            fileAst: parseResult,
            fileContent,
            ast,
            fileComments: result.comments,
            scope: path.scope,
          }),
        );
      }
    },
  });

  return result;
};
