import * as t from '@babel/types';
import { MachineExtractResult } from './MachineExtractResult';

export type Location = t.SourceLocation | null;

export interface StringLiteralNode {
  value: string;
  node: t.Node;
}

export interface ParserContext {
  file: t.File;
  getNodeHash: (node: t.Node) => string;
}

export interface Parser<T extends t.Node = any, Result = any> {
  parse: (
    node: t.Node | undefined | null,
    context: ParserContext,
  ) => Result | undefined;
  matches: (node: T) => boolean;
}

export interface AnyParser<Result> {
  parse: (node: any, context: ParserContext) => Result | undefined;
  matches: (node: any) => boolean;
}

export interface Comment {
  node: t.CommentLine | t.CommentBlock;
  type: 'xstate-ignore-next-line' | 'xstate-layout';
}

export interface FileExtractResult<
  T extends MachineExtractResult | undefined = MachineExtractResult | undefined,
> {
  machines: T[];
  file: t.File;
}

export type DeclarationType = 'named' | 'inline' | 'identifier' | 'unknown';
