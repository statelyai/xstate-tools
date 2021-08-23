import { Range } from "vscode-languageserver-textdocument";
import type { SourceLocation } from "@babel/types";

export const getRangeFromSourceLocation = (location: SourceLocation): Range => {
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
