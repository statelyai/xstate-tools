import * as t from '@babel/types';
import { Range } from 'vscode-languageserver-textdocument';

export const getRangeFromSourceLocation = (
  location: t.SourceLocation,
): Range => {
  return {
    start: {
      character: location.start.column,
      line: location.start.line - 1,
    },
    end: {
      character: location.end.column,
      line: location.end.line - 1,
    },
  };
};
