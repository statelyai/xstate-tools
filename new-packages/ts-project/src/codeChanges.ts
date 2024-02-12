import type {
  ObjectLiteralExpression,
  PropertyAssignment,
  SourceFile,
} from 'typescript';
import * as charCodes from './charCodes';
import { Range, TextEdit } from './types';

interface BaseCodeChange {
  type: string;
  sourceFile: SourceFile;
  range: Range;
}

interface InsertBeforePropertyCodeChange extends BaseCodeChange {
  type: 'insert_before_property';
  property: PropertyAssignment;
  newText: string;
}

interface InsertIntoObjectCodeChange extends BaseCodeChange {
  type: 'insert_into_object';
  object: ObjectLiteralExpression;
  newText: string;
}

interface ReplaceCodeChange extends BaseCodeChange {
  type: 'replace';
  newText: string;
}

type CodeChange =
  | InsertBeforePropertyCodeChange
  | InsertIntoObjectCodeChange
  | ReplaceCodeChange;

function toZeroLengthRange(position: number) {
  return { start: position, end: position };
}

function getIndentationAndInsertionPointFromFullStart(
  { text }: SourceFile,
  fullStart: number,
) {
  let indentStart = fullStart;
  let current = fullStart;

  while (true) {
    const char = text[current];

    if (!/\s/.test(char)) {
      break;
    }

    current++;

    if (char === '\n' || char === '\r') {
      indentStart = current;
    }
  }
  return {
    indentation: text.slice(indentStart, current),
    insertionPoint: current,
  };
}

export function createCodeChanges(ts: typeof import('typescript')) {
  const changes: CodeChange[] = [];

  return {
    insertBeforeProperty: (property: PropertyAssignment, newText: string) => {
      changes.push({
        type: 'insert_before_property',
        sourceFile: property.getSourceFile(),
        range: toZeroLengthRange(property.getFullStart()),
        property,
        newText,
      });
    },
    insertIntoObject: (object: ObjectLiteralExpression, newText: string) => {
      changes.push({
        type: 'insert_into_object',
        sourceFile: object.getSourceFile(),
        range: toZeroLengthRange(object.getStart() + 1), // position right after the opening curly brace
        object,
        newText,
      });
    },
    replace: (
      sourceFile: SourceFile,
      { range, newText }: Pick<ReplaceCodeChange, 'range' | 'newText'>,
    ) => {
      changes.push({
        type: 'replace',
        sourceFile,
        range,
        newText,
      });
    },

    getTextEdits: (): TextEdit[] => {
      const edits: TextEdit[] = [];

      const sortedChanges = [...changes].sort((a, b) => {
        if (a.sourceFile !== b.sourceFile) {
          return a.sourceFile.fileName < b.sourceFile.fileName ? -1 : 1;
        }
        if (a.type !== b.type) {
          return a.range.start - b.range.start;
        }
        return 0;
      });

      for (let i = 0; i < sortedChanges.length; i++) {
        const change = sortedChanges[i];
        switch (change.type) {
          case 'insert_before_property': {
            const { indentation, insertionPoint } =
              getIndentationAndInsertionPointFromFullStart(
                change.sourceFile,
                change.property.getFullStart(),
              );
            edits.push({
              type: 'insert',
              fileName: change.sourceFile.fileName,
              position: insertionPoint,
              newText: change.newText + ',\n' + indentation,
            });
            break;
          }
          case 'insert_into_object':
            break;
          case 'replace':
            edits.push({
              type: 'replace',
              fileName: change.sourceFile.fileName,
              range: change.range,
              newText: change.newText,
            });
            break;
        }
      }

      return edits;
    },
  };
}
