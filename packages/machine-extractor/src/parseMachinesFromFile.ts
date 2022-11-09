import * as t from '@babel/types';
import { getMachineNodesFromFile } from './getMachineNodesFromFile';
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

  const { file, machineNodes } = getMachineNodesFromFile(fileContent);

  const comments = (file.comments || [])
    .map((comment) => {
      if (comment.value.includes('xstate-ignore-next-line')) {
        return {
          type: 'xstate-ignore-next-line',
          node: comment,
        } as const;
      }

      if (comment.value.includes('@xstate-layout')) {
        return {
          type: 'xstate-layout',
          node: comment,
        } as const;
      }
    })
    .filter((comment): comment is NonNullable<typeof comment> => !!comment);

  let result: ParseResult = {
    machines: machineNodes
      .map((node) => {
        const extractResult = MachineCallExpression.parse(node, {
          file,
          getNodeHash: (node: t.Node): string => {
            const fileText = fileContent.substring(node.start!, node.end!);
            return hashedId(fileText);
          },
        });
        return (
          extractResult &&
          new MachineParseResult({
            fileAst: file,
            fileContent,
            ast: extractResult,
            fileComments: comments,
          })
        );
      })
      .filter((result): result is NonNullable<typeof result> => !!result),
    comments,
    file,
  };

  return result;
};
