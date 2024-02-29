import type {
  ArrayLiteralExpression,
  Node,
  ObjectLiteralExpression,
  PropertyAssignment,
  SourceFile,
} from 'typescript';
import * as charCodes from './charCodes';
import { safeStringLikeLiteralText } from './safeStringLikeLiteralText';
import { Range, TextEdit } from './types';
import {
  assert,
  assertUnreachable,
  findLast,
  findProperty,
  first,
  last,
} from './utils';

type Values<T> = T[keyof T];

type InsertionPriorityType = Values<typeof InsertionPriority>;

interface BaseCodeChange {
  type: string;
  sourceFile: SourceFile;
  range: Range;
  priority?: InsertionPriorityType | undefined;
}

interface InsertAtOptionalObjectPathCodeChange extends BaseCodeChange {
  type: 'insert_at_optional_object_path';
  object: ObjectLiteralExpression;
  path: string[];
  value: InsertionElement;
}

interface InsertElementIntoArrayCodeChange extends BaseCodeChange {
  type: 'insert_element_into_array';
  array: ArrayLiteralExpression;
  value: InsertionElement;
  index: number;
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

interface ReplaceWithCodeChange extends BaseCodeChange {
  type: 'replace_with';
  current: Node;
  replacement: InsertionElement;
}

interface WrapIntoArrayWithCodeChange extends BaseCodeChange {
  type: 'wrap_into_array_with';
  current: Node;
  insertionType: 'append' | 'prepend';
  newElement: InsertionElement;
}

type CodeChange =
  | InsertAtOptionalObjectPathCodeChange
  | InsertElementIntoArrayCodeChange
  | InsertPropertyBeforePropertyCodeChange
  | InsertPropertyIntoObjectCodeChange
  | RemovePropertyNameChange
  | ReplacePropertyNameChange
  | ReplaceRangeCodeChange
  | ReplaceWithCodeChange
  | WrapIntoArrayWithCodeChange;

function toZeroLengthRange(position: number) {
  return { start: position, end: position };
}

function getIndentationBeforePosition(text: string, position: number) {
  let indentEnd = position;

  for (let i = indentEnd - 1; i >= 0; i--) {
    const char = text[i];

    if (char === '\n' || char === '\r') {
      return text.slice(i + 1, indentEnd);
    }

    if (!/\s/.test(char)) {
      indentEnd = i;
    }
  }

  return text.slice(0, indentEnd);
}

function getSingleLineWhitespaceBeforePosition(text: string, position: number) {
  let end = position;

  for (let i = end - 1; i >= 0; i--) {
    const char = text[i];

    if (!/\s/.test(char) || char === '\n' || char === '\r') {
      return text.slice(i + 1, end);
    }
  }

  return text.slice(0, end);
}

function getLeadingWhitespaceLength(text: string) {
  return text.match(/^\s*/)?.[0].length || 0;
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

function getContainerTrailingCommaPosition(
  ts: typeof import('typescript'),
  container: ObjectLiteralExpression | ArrayLiteralExpression,
) {
  if (
    container.kind === ts.SyntaxKind.ObjectLiteralExpression
      ? !container.properties.hasTrailingComma
      : !container.elements.hasTrailingComma
  ) {
    return;
  }

  // this should always be in the middle of the children: [openToken, syntaxList, closeToken]
  // erring on the safe side it's being searched for here
  const syntaxList = container
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

function toSafeStringText(
  ts: typeof import('typescript'),
  sourceFile: SourceFile,
  text: string,
) {
  return safeStringLikeLiteralText(
    text,
    getPreferredQuoteCharCode(ts, sourceFile),
  );
}

function toSafePropertyNameText(
  ts: typeof import('typescript'),
  sourceFile: SourceFile,
  name: string,
) {
  if (isValidIdentifier(name)) {
    return name;
  }
  const safeString = toSafeStringText(ts, sourceFile, name);
  return safeString.charCodeAt(0) === charCodes.backtick
    ? `[${safeString}]`
    : safeString;
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

  const codeChanges = {
    insertAtOptionalObjectPath: (
      object: ObjectLiteralExpression,
      path: (string | number)[],
      value: InsertionElement,
      priority?: InsertionPriorityType,
    ) => {
      let current = object;
      for (let i = 0; i < path.length - 1; i++) {
        const segment = path[i];
        assert(typeof segment === 'string');
        const prop = findProperty(undefined, ts, current, segment);
        if (!prop) {
          codeChanges.insertPropertyIntoObject(
            current,
            segment,
            path
              .slice(i + 1)
              .reverse()
              .reduce((v, segment) => {
                if (typeof segment === 'number') {
                  // if the previous segment doesn't exist then this always ought to be the first item in an arrayifiable property
                  // and we can just skip this numeric segment
                  assert(segment === 0);
                  return v;
                }
                return c.object([c.property(segment, v)]);
              }, value),
          );
          return;
        }
        const nextSegment = path[i + 1];
        if (typeof nextSegment === 'number') {
          const isNextTheLastSegment = i + 1 === path.length - 1;
          // skip next segment as we are processing it here
          i++;

          if (isNextTheLastSegment) {
            if (!ts.isArrayLiteralExpression(prop.initializer)) {
              const existing = prop.initializer;

              if (nextSegment === 0) {
                codeChanges.wrapIntoArrayWith(existing, 'append', value);
                return;
              }
              if (nextSegment === 1) {
                codeChanges.wrapIntoArrayWith(existing, 'prepend', value);
                return;
              }

              assertUnreachable();
            }

            codeChanges.insertElementIntoArray(
              prop.initializer,
              value,
              nextSegment,
            );
            return;
          }
          assert(
            ts.isArrayLiteralExpression(prop.initializer) || nextSegment === 0,
          );
          const existingElement = ts.isArrayLiteralExpression(prop.initializer)
            ? prop.initializer.elements[nextSegment]
            : prop.initializer;
          assert(ts.isObjectLiteralExpression(existingElement));
          current = existingElement;
          continue;
        }
        assert(ts.isObjectLiteralExpression(prop.initializer));
        current = prop.initializer;
      }
      const lastSegment = last(path);
      assert(typeof lastSegment === 'string');
      codeChanges.insertPropertyIntoObject(
        current,
        lastSegment,
        value,
        priority,
      );
    },

    insertElementIntoArray(
      array: ArrayLiteralExpression,
      value: InsertionElement,
      index: number,
    ) {
      assert(index >= 0 && index <= array.elements.length);

      changes.push({
        type: 'insert_element_into_array',
        sourceFile: array.getSourceFile(),

        range: toZeroLengthRange(
          index === 0
            ? array.getStart() + 1 // after opening square bracket
            : index === array.elements.length - 1
            ? array.getEnd() - 1 // before closing square bracket
            : array.elements[index - 1].getEnd() + 1, // after comma located after the previous element
        ),
        array,
        value,
        index,
      });
    },

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
    replaceWith: (current: Node, replacement: InsertionElement) => {
      changes.push({
        type: 'replace_with',
        sourceFile: current.getSourceFile(),
        range: {
          start: current.getStart(),
          end: current.getEnd(),
        },
        current,
        replacement,
      });
    },
    wrapIntoArrayWith: (
      current: Node,
      insertionType: 'append' | 'prepend',
      newElement: InsertionElement,
    ) => {
      changes.push({
        type: 'wrap_into_array_with',
        sourceFile: current.getSourceFile(),
        range: {
          start: current.getStart(),
          end: current.getEnd(),
        },
        current,
        insertionType,
        newElement,
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
          case 'insert_element_into_array': {
            // TODO: this could be smarter about consuming multiple insertions into the same array at once
            // Studio doesn't currently do that though

            // this has very similar logic to `insert_property_before_property` and `insert_property_into_object`
            // some deduplication could be done but it's not worth it for now
            // it's disputable but this currently is in a single handler on purpose
            // the reasoning is that *order* is important with arrays whereas it's not with objects (beyond the fact that the last property with the same name wins)
            // so it's easier to have some control and validation here if it's centralized
            // the content of the handler could still delegate to a shared function though
            if (change.index < change.array.elements.length) {
              const existingElement = change.array.elements[change.index];

              const hasNewLineBeforeElement = change.sourceFile.text
                .slice(
                  existingElement.getFullStart(),
                  existingElement.getStart(),
                )
                .includes('\n');

              edits.push({
                type: 'insert',
                fileName: change.sourceFile.fileName,
                position:
                  (hasNewLineBeforeElement
                    ? first(
                        ts.getLeadingCommentRanges(
                          change.sourceFile.text,
                          existingElement.getFullStart(),
                        ),
                      )?.pos
                    : last(
                        ts.getTrailingCommentRanges(
                          change.sourceFile.text,
                          existingElement.getFullStart(),
                        ),
                      )?.pos) || existingElement.getStart(),
                newText:
                  insertionToText(
                    ts,
                    change.sourceFile,
                    change.value,
                    formattingOptions,
                  ) +
                  ',\n' +
                  getIndentationBeforePosition(
                    change.sourceFile.text,
                    existingElement.getStart(),
                  ),
              });
              break;
            }

            const lastElement = last(change.array.elements);

            const insertedText = insertionToText(
              ts,
              change.sourceFile,
              change.value,
              formattingOptions,
            );

            if (lastElement) {
              const trailingCommaPosition = getContainerTrailingCommaPosition(
                ts,
                change.array,
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
                    insertedText,
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
              change.array.getStart(),
            );

            const lastComment = getLastComment(
              ts,
              change.sourceFile,
              change.array.getStart() + 1,
            );

            const isArrayMultiline = change.sourceFile.text
              .slice(change.array.getStart(), change.array.getEnd())
              .includes('\n');

            edits.push({
              type: 'insert',
              fileName: change.sourceFile.fileName,
              position: lastComment?.end ?? change.array.getStart() + 1,
              newText:
                '\n' +
                indentTextWith(
                  insertedText,
                  currentIdentation + formattingOptions.singleIndentation,
                ) +
                (!isArrayMultiline ? `\n${currentIdentation}` : ''),
            });
            break;
          }
          case 'insert_property_before_property': {
            const hasNewLineBeforeProperty = change.sourceFile.text
              .slice(change.property.getFullStart(), change.property.getStart())
              .includes('\n');
            edits.push({
              type: 'insert',
              fileName: change.sourceFile.fileName,
              position:
                (hasNewLineBeforeProperty
                  ? first(
                      ts.getLeadingCommentRanges(
                        change.sourceFile.text,
                        change.property.getFullStart(),
                      ),
                    )?.pos
                  : last(
                      ts.getTrailingCommentRanges(
                        change.sourceFile.text,
                        change.property.getFullStart(),
                      ),
                    )?.pos) || change.property.getStart(),
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
              const trailingCommaPosition = getContainerTrailingCommaPosition(
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
          // TODO: implement property counting + collapsing empty objects
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

            start -=
              whitespace.length +
              (change.sourceFile.text[start - whitespace.length - 1] === '\n'
                ? 1
                : 0);

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
          case 'replace_with':
            throw new Error('Not implemented');
          case 'wrap_into_array_with': {
            const currentIdentation = getIndentationBeforePosition(
              change.sourceFile.text,
              change.current.getStart(),
            );
            const hasNewLine = change.current.getFullText().includes('\n');
            const trailingComment = last(
              ts.getTrailingCommentRanges(
                change.sourceFile.text,
                change.current.getEnd(),
              ),
            );

            const newElementIndentation = hasNewLine
              ? currentIdentation
              : currentIdentation + formattingOptions.singleIndentation;

            if (hasNewLine) {
              edits.push({
                type: 'insert',
                fileName: change.sourceFile.fileName,
                position: change.current.getFullStart(),
                newText: ` [`,
              });
            } else {
              const leadingTrivia = change.sourceFile.text.slice(
                change.current.getFullStart(),
                change.current.getStart(),
              );
              edits.push({
                type: 'insert',
                fileName: change.sourceFile.fileName,
                position:
                  change.current.getFullStart() +
                  getLeadingWhitespaceLength(leadingTrivia),
                newText: `[\n` + newElementIndentation,
              });
            }

            if (trailingComment) {
              edits.push({
                type: 'insert',
                fileName: change.sourceFile.fileName,
                position: change.current.getEnd(),
                newText: ',',
              });
            }

            edits.push({
              type: 'insert',
              fileName: change.sourceFile.fileName,
              position: trailingComment?.end ?? change.current.getEnd(),
              newText:
                (trailingComment ? '' : `,`) +
                `\n` +
                newElementIndentation +
                insertionToText(
                  ts,
                  change.sourceFile,
                  change.newElement,
                  formattingOptions,
                ) +
                '\n' +
                getIndentationBeforePosition(
                  change.sourceFile.text,
                  change.current.getFullStart(),
                ) +
                `]`,
            });

            break;
          }
        }
      }

      return edits;
    },
  };

  return codeChanges;
}

function insertionToText(
  ts: typeof import('typescript'),
  sourceFile: SourceFile,
  element: InsertionElement,
  formattingOptions: { singleIndentation: string },
  depth = 0,
): string {
  switch (element.type) {
    case 'array': {
      return (
        `[` +
        element.elements
          .map((e) =>
            insertionToText(ts, sourceFile, e, formattingOptions, depth),
          )
          .join(', ') +
        `]`
      );
    }
    case 'object': {
      if (!element.properties.length) {
        return '{}';
      }
      const properties = element.properties
        .map(
          (prop) =>
            formattingOptions.singleIndentation.repeat(depth + 1) +
            insertionToText(ts, sourceFile, prop, formattingOptions, depth + 1),
        )
        .join(',\n');
      return (
        '{\n' +
        properties +
        '\n' +
        formattingOptions.singleIndentation.repeat(depth) +
        '}'
      );
    }
    case 'property': {
      const nameText = toSafePropertyNameText(ts, sourceFile, element.key);
      const valueText = insertionToText(
        ts,
        sourceFile,
        element.value,
        formattingOptions,
        depth,
      );
      return `${nameText}: ${valueText}`;
    }
    case 'string':
      const safeString = toSafeStringText(ts, sourceFile, element.text);
      return safeString.charCodeAt(0) === charCodes.backtick
        ? element.formattingPreferences?.allowMultiline
          ? // it's wasteful to unescape what just got escaped but it's easier
            safeString.replace(/\\(r|n)/g, (_, p1) =>
              p1 === 'r' ? '\r' : '\n',
            )
          : safeString
        : safeString;
    case 'undefined':
      return 'undefined';
    case 'boolean':
      return element.value ? 'true' : 'false';
    case 'raw':
      return element.value;
  }
}

interface ArrayInsertionElement {
  type: 'array';
  elements: InsertionElement[];
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
  formattingPreferences?:
    | {
        allowMultiline?: boolean;
      }
    | undefined;
}

interface UndefinedInsertionElement {
  type: 'undefined';
}

interface BooleanInsertionElement {
  type: 'boolean';
  value: boolean;
}

interface RawInsertionElement {
  type: 'raw';
  value: string;
}

export type InsertionElement =
  | ArrayInsertionElement
  | ObjectInsertionElement
  | PropertyInsertionElement
  | StringInsertionElement
  | UndefinedInsertionElement
  | BooleanInsertionElement
  | RawInsertionElement;

export const c = {
  array: (elements: InsertionElement[]): ArrayInsertionElement => {
    return {
      type: 'array',
      elements,
    };
  },
  object: (properties: PropertyInsertionElement[]): ObjectInsertionElement => {
    return {
      type: 'object',
      properties,
    };
  },
  property: (
    key: string,
    value: InsertionElement,
  ): PropertyInsertionElement => {
    return {
      type: 'property',
      key,
      value,
    };
  },
  string: (
    text: string,
    formattingPreferences?: StringInsertionElement['formattingPreferences'],
  ): StringInsertionElement => {
    return {
      type: 'string',
      text,
      formattingPreferences,
    };
  },
  undefined: (): UndefinedInsertionElement => ({
    type: 'undefined',
  }),
  boolean: (value: boolean): BooleanInsertionElement => ({
    type: 'boolean',
    value,
  }),
  raw: (value: string): RawInsertionElement => ({
    type: 'raw',
    value,
  }),
};

export const InsertionPriority = {
  None: 0,
  States: 1,
  Initial: 2,
  History: 3,
  StateType: 4,
} as const;
