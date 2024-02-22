import type {
  Node,
  ObjectLiteralExpression,
  PropertyAssignment,
  SourceFile,
} from 'typescript';
import * as charCodes from './charCodes';
import { safeStringLikeLiteralText } from './safeStringLikeLiteralText';
import { Range, TextEdit } from './types';
import { findLast, first, last } from './utils';

type Values<T> = T[keyof T];

type InsertionPriorityType = Values<typeof InsertionPriority>;

interface BaseCodeChange {
  type: string;
  sourceFile: SourceFile;
  range: Range;
  priority?: InsertionPriorityType | undefined;
}

interface InsertPropertyBeforePropertyCodeChange extends BaseCodeChange {
  type: 'insert_property_before_property';
  property: PropertyAssignment;
  name: string;
  value: InsertionElement;
}

interface InsertPropertyIntoObjectCodeChange extends BaseCodeChange {
  type: 'insert_property_into_object';
  object: ObjectLiteralExpression;
  name: string;
  value: InsertionElement;
}

interface RemovePropertyNameChange extends BaseCodeChange {
  type: 'remove_property';
  property: PropertyAssignment;
}

interface ReplacePropertyNameChange extends BaseCodeChange {
  type: 'replace_property_name';
  name: string;
}

interface ReplaceRangeCodeChange extends BaseCodeChange {
  type: 'replace_range';
  element: InsertionElement;
}

type CodeChange =
  | InsertPropertyBeforePropertyCodeChange
  | InsertPropertyIntoObjectCodeChange
  | RemovePropertyNameChange
  | ReplacePropertyNameChange
  | ReplaceRangeCodeChange;

function toZeroLengthRange(position: number) {
  return { start: position, end: position };
}

function getIndentationBeforePosition(text: string, position: number) {
  let indentEnd = position;
  let current = indentEnd - 1;

  while (true) {
    const char = text[current];

    if (char === '\n' || char === '\r') {
      break;
    }

    if (!/\s/.test(char)) {
      indentEnd = current;
    }

    current--;
  }
  return text.slice(current + 1, indentEnd);
}

function getSingleLineWhitespaceBeforePosition(text: string, position: number) {
  let end = position;
  let current = end - 1;

  while (true) {
    const char = text[current];

    if (!/\s/.test(char) || char === '\n' || char === '\r') {
      break;
    }

    current--;
  }
  return text.slice(current + 1, end);
}

function getTrailingCommaPosition({ text }: SourceFile, position: number) {
  for (let i = position; i < text.length; i++) {
    const char = text[i];
    if (char === ',') {
      return i;
    }
    if (!/\s/.test(char)) {
      break;
    }
  }
  return -1;
}

function getObjectTrailingCommaPosition(
  ts: typeof import('typescript'),
  object: ObjectLiteralExpression,
) {
  if (!object.properties.hasTrailingComma) {
    return;
  }

  // this should always be in the middle of the children: [openBrace, syntaxList, closeBrace]
  // erring on the safe side it's being searched for here
  const syntaxList = object
    .getChildren()
    .find((child) => child.kind === ts.SyntaxKind.SyntaxList)!;

  return findLast(
    syntaxList.getChildren(),
    (child) => child.kind === ts.SyntaxKind.CommaToken,
  )!.getStart();
}

function getLastComment(
  ts: typeof import('typescript'),
  sourceFile: SourceFile,
  position: number,
) {
  return (
    last(ts.getLeadingCommentRanges(sourceFile.text, position)) ??
    last(ts.getTrailingCommentRanges(sourceFile.text, position))
  );
}

function isValidIdentifier(name: string): boolean {
  return /^(?!\d)[\w$]+$/.test(name);
}

function getPreferredQuoteCharCode(
  ts: typeof import('typescript'),
  sourceFile: SourceFile,
) {
  for (const statement of sourceFile.statements) {
    if (
      (ts.isImportDeclaration(statement) ||
        ts.isExportDeclaration(statement)) &&
      statement.moduleSpecifier &&
      // it should always be a string literal but TS allows other things here (for which grammar errors are raised)
      ts.isStringLiteral(statement.moduleSpecifier)
    ) {
      return statement.moduleSpecifier.getText().charCodeAt(0) as
        | typeof charCodes.doubleQuote
        | typeof charCodes.singleQuote;
    }
  }

  return charCodes.doubleQuote;
}

function safePropertyNameString(
  name: string,
  preferredQuoteCharCode:
    | typeof charCodes.doubleQuote
    | typeof charCodes.singleQuote
    | typeof charCodes.backtick,
) {
  const safeString = safeStringLikeLiteralText(name, preferredQuoteCharCode);
  return safeString.charCodeAt(0) === charCodes.backtick
    ? `[${safeString}]`
    : safeString;
}

function toSafeStringText(
  ts: typeof import('typescript'),
  sourceFile: SourceFile,
  text: string,
) {
  return safePropertyNameString(
    text,
    getPreferredQuoteCharCode(ts, sourceFile),
  );
}

function toSafePropertyNameText(
  ts: typeof import('typescript'),
  sourceFile: SourceFile,
  name: string,
) {
  return isValidIdentifier(name)
    ? name
    : toSafeStringText(ts, sourceFile, name);
}

function toInsertedPropertyText(
  ts: typeof import('typescript'),
  {
    sourceFile,
    name,
    initializerText,
  }: {
    sourceFile: SourceFile;
    name: string;
    initializerText: string;
  },
) {
  return `${toSafePropertyNameText(ts, sourceFile, name)}: ${initializerText}`;
}

function indentTextWith(text: string, indentation: string) {
  return text.replace(/^/gm, indentation);
}

function consumeCodeChangeGroupFrom<T extends CodeChange>(
  changes: CodeChange[],
  first: T,
): T[] {
  // the inferred return type of the function can be derived from parameters
  // so we have to accept it as parameter and retrieve the index on our own
  const start = changes.indexOf(first);
  const consumed: T[] = [first];
  for (let i = start + 1; i < changes.length; i++) {
    const nextChange = changes[i];
    if (
      first.sourceFile !== nextChange.sourceFile &&
      first.type !== nextChange.type &&
      first.range.start !== nextChange.range.start
    ) {
      break;
    }
    consumed.push(nextChange as T);
  }
  return consumed;
}

export function createCodeChanges(ts: typeof import('typescript')) {
  const changes: CodeChange[] = [];

  return {
    insertPropertyBeforeProperty: (
      property: PropertyAssignment,
      name: string,
      value: InsertionElement,
    ) => {
      changes.push({
        type: 'insert_property_before_property',
        sourceFile: property.getSourceFile(),
        range: toZeroLengthRange(property.getFullStart()),
        property,
        name,
        value,
      });
    },
    insertPropertyIntoObject: (
      object: ObjectLiteralExpression,
      name: string,
      value: InsertionElement,
      priority?: InsertionPriorityType,
    ) => {
      changes.push({
        type: 'insert_property_into_object',
        sourceFile: object.getSourceFile(),
        range: toZeroLengthRange(object.getStart() + 1), // position right after the opening curly brace
        object,
        name,
        value,
        priority,
      });
    },
    removeProperty: (property: PropertyAssignment) => {
      changes.push({
        type: 'remove_property',
        sourceFile: property.getSourceFile(),
        range: {
          start: property.getStart(),
          end: property.getEnd(),
        },
        property,
      });
    },
    replacePropertyName: (property: PropertyAssignment, name: string) => {
      changes.push({
        type: 'replace_property_name',
        sourceFile: property.getSourceFile(),
        range: {
          start: property.name.getStart(),
          end: property.name.getEnd(),
        },
        name,
      });
    },
    replaceRange: (
      sourceFile: SourceFile,
      { range, element }: Pick<ReplaceRangeCodeChange, 'range' | 'element'>,
    ) => {
      changes.push({
        type: 'replace_range',
        sourceFile,
        range,
        element,
      });
    },

    getTextEdits: (): TextEdit[] => {
      const edits: TextEdit[] = [];

      const singleIndentationsCache = new Map<SourceFile, string>();

      function getSingleIndentation(sourceFile: SourceFile) {
        let singleIndentation = singleIndentationsCache.get(sourceFile);
        if (singleIndentation === undefined) {
          singleIndentation =
            /^([^\S\n]+)(?!\/|\*|\n)\S/m.exec(sourceFile.text)?.[1] || '\t';
          singleIndentationsCache.set(sourceFile, singleIndentation);
        }
        return singleIndentation;
      }

      const sortedChanges = [...changes].sort((a, b) => {
        if (a.sourceFile !== b.sourceFile) {
          return a.sourceFile.fileName < b.sourceFile.fileName ? -1 : 1;
        }
        if (a.type !== b.type) {
          return a.range.start - b.range.start;
        }
        if (typeof a.priority === 'number') {
          if (typeof b.priority === 'number') {
            // the higher priority items are meant to come first
            return b.priority - a.priority;
          }
          return -1;
        }
        return 0;
      });

      for (let i = 0; i < sortedChanges.length; i++) {
        const change = sortedChanges[i];
        const formattingOptions = {
          singleIndentation: getSingleIndentation(change.sourceFile),
        };
        switch (change.type) {
          case 'insert_property_before_property': {
            edits.push({
              type: 'insert',
              fileName: change.sourceFile.fileName,
              position:
                first(
                  ts.getLeadingCommentRanges(
                    change.sourceFile.text,
                    change.property.getFullStart(),
                  ),
                )?.pos || change.property.getStart(),
              newText:
                insertionToText(
                  ts,
                  change.sourceFile,
                  c.property(change.name, change.value),
                  formattingOptions,
                ) +
                ',\n' +
                getIndentationBeforePosition(
                  change.sourceFile.text,
                  change.property.getStart(),
                ),
            });
            break;
          }
          case 'insert_property_into_object': {
            const insertedProperties = consumeCodeChangeGroupFrom(
              sortedChanges,
              change,
            );

            // adjust the index to skip the consumed changes
            i += insertedProperties.length - 1;

            const lastElement = last(change.object.properties);

            const propertiesText = insertedProperties
              .map((propChange) =>
                insertionToText(
                  ts,
                  propChange.sourceFile,
                  c.property(propChange.name, propChange.value),
                  formattingOptions,
                ),
              )
              .join(',\n');

            if (lastElement) {
              const trailingCommaPosition = getObjectTrailingCommaPosition(
                ts,
                change.object,
              );

              // this specifically targets only trailing comments
              // if there are leading comments (below this node) then we don't want to move them to be before what we are about to insert
              const lastTrailingComment = last(
                ts.getTrailingCommentRanges(
                  change.sourceFile.text,
                  trailingCommaPosition
                    ? trailingCommaPosition + 1
                    : lastElement.getEnd(),
                ),
              );

              if (!trailingCommaPosition && lastTrailingComment) {
                edits.push({
                  type: 'insert',
                  fileName: change.sourceFile.fileName,
                  position: lastElement.getEnd(),
                  newText: `,`,
                });
              }

              edits.push({
                type: 'insert',
                fileName: change.sourceFile.fileName,
                position: lastTrailingComment
                  ? lastTrailingComment.end
                  : trailingCommaPosition
                  ? trailingCommaPosition + 1
                  : lastElement.getEnd(),
                newText:
                  (!trailingCommaPosition && !lastTrailingComment ? ',' : '') +
                  '\n' +
                  indentTextWith(
                    propertiesText,
                    getIndentationBeforePosition(
                      change.sourceFile.text,
                      lastElement.getStart(),
                    ),
                  ) +
                  (!!trailingCommaPosition ? ',' : ''),
              });

              break;
            }

            const currentIdentation = getIndentationBeforePosition(
              change.sourceFile.text,
              change.object.getStart(),
            );

            const lastComment = getLastComment(
              ts,
              change.sourceFile,
              change.object.getStart() + 1,
            );

            const isObjectMultiline = change.sourceFile.text
              .slice(change.object.getStart(), change.object.getEnd())
              .includes('\n');

            edits.push({
              type: 'insert',
              fileName: change.sourceFile.fileName,
              position: lastComment?.end ?? change.object.getStart() + 1,
              newText:
                '\n' +
                indentTextWith(
                  propertiesText,
                  currentIdentation + formattingOptions.singleIndentation,
                ) +
                (!isObjectMultiline ? `\n${currentIdentation}` : ''),
            });
            break;
          }
          case 'remove_property': {
            const leadingComment = first(
              ts.getLeadingCommentRanges(
                change.sourceFile.text,
                change.property.getFullStart(),
              ),
            );
            let start = leadingComment?.pos ?? change.property.getStart();

            const whitespace = getSingleLineWhitespaceBeforePosition(
              change.sourceFile.text,
              start,
            );
            if (
              change.sourceFile.text[start - whitespace.length - 1] === '\n'
            ) {
              start -= whitespace.length + 1;
            } else {
              start -= whitespace.length;
            }
            const trailingComment = last(
              ts.getTrailingCommentRanges(
                change.sourceFile.text,
                change.range.end,
              ),
            );
            let end = trailingComment?.end ?? change.range.end;
            const trailingCommaPosition = getTrailingCommaPosition(
              change.sourceFile,
              end,
            );
            if (trailingCommaPosition !== -1) {
              end = trailingCommaPosition + 1;
              const trailingComment = last(
                ts.getTrailingCommentRanges(change.sourceFile.text, end),
              );
              if (trailingComment) {
                end = trailingComment.end;
              }
            }
            edits.push({
              type: 'delete',
              fileName: change.sourceFile.fileName,
              range: {
                start,
                end,
              },
            });
            break;
          }
          case 'replace_property_name':
            edits.push({
              type: 'replace',
              fileName: change.sourceFile.fileName,
              range: change.range,
              newText: toSafePropertyNameText(
                ts,
                change.sourceFile,
                change.name,
              ),
            });
            break;
          case 'replace_range':
            edits.push({
              type: 'replace',
              fileName: change.sourceFile.fileName,
              range: change.range,
              newText: insertionToText(
                ts,
                change.sourceFile,
                change.element,
                formattingOptions,
              ),
            });
            break;
        }
      }

      return edits;
    },
  };
}

function insertionToText(
  ts: typeof import('typescript'),
  sourceFile: SourceFile,
  element: InsertionElement,
  formattingOptions: { singleIndentation: string },
): string {
  switch (element.type) {
    case 'object':
      if (!element.properties.length) {
        return '{}';
      }
      const properties = element.properties
        .map(
          (prop) =>
            formattingOptions.singleIndentation +
            insertionToText(ts, sourceFile, prop, formattingOptions),
        )
        .join(',');
      return '{\n' + properties + '\n}';
    case 'property': {
      const nameText = toSafePropertyNameText(ts, sourceFile, element.key);
      const valueText = insertionToText(
        ts,
        sourceFile,
        element.value,
        formattingOptions,
      );
      return `${nameText}: ${valueText}`;
    }
    case 'string':
      return toSafeStringText(ts, sourceFile, element.text);
  }
}

interface ObjectInsertionElement {
  type: 'object';
  properties: PropertyInsertionElement[];
}

interface PropertyInsertionElement {
  type: 'property';
  key: string;
  value: InsertionElement;
}

interface StringInsertionElement {
  type: 'string';
  text: string;
}

type InsertionElement =
  | ObjectInsertionElement
  | PropertyInsertionElement
  | StringInsertionElement;

export const c = {
  object: (properties: PropertyInsertionElement[]): ObjectInsertionElement => {
    return {
      type: 'object' as const,
      properties,
    };
  },
  property: (
    key: string,
    value: InsertionElement,
  ): PropertyInsertionElement => {
    return {
      type: 'property' as const,
      key,
      value,
    };
  },
  string: (text: string): StringInsertionElement => {
    return {
      type: 'string' as const,
      text,
    };
  },
};

export const InsertionPriority = {
  None: 0,
  States: 1, // at the moment it wouldn't have to exist but it should help to keep `states` close to `initial` so it's listed explicitly here
  Initial: 2,
} as const;
