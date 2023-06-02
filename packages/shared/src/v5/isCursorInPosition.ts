import type { Location } from '@xstate/machine-extractor';
import type { Position } from 'vscode-languageserver-textdocument';

export const isCursorInPosition = (
  nodeSourceLocation: Location,
  cursorPosition: Position,
) => {
  if (!nodeSourceLocation) return;
  const isOnSameLine =
    nodeSourceLocation.start.line - 1 === cursorPosition.line;

  const isWithinChars =
    cursorPosition.character >= nodeSourceLocation.start.column &&
    cursorPosition.character <= nodeSourceLocation.end.column;
  if (isOnSameLine) {
    return isWithinChars;
  }

  const isWithinLines =
    cursorPosition.line >= nodeSourceLocation.start.line - 1 &&
    cursorPosition.line <= nodeSourceLocation.end.line;

  return isWithinLines;
};
