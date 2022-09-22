import { NodePath, types as t } from "@babel/core";
import { MachineParseResult } from "./MachineParseResult";

export type Location = t.SourceLocation | null;

export interface StringLiteralNode {
  value: string;
  node: t.Node;
  path: NodePath<t.Node>;
}

export interface ParserContext {
  file: t.File;
  getNodeHash: (node: t.Node) => string;
}

export interface Parser<T extends t.Node = any, Result = any> {
  parse: (
    node: NodePath<T | undefined | null> | undefined | null,
    context: ParserContext
  ) => Result | undefined;
  matches: (node: t.Node) => boolean;
}

export interface AnyParser<Result> {
  parse: (
    node: NodePath<any> | null | undefined,
    context: ParserContext
  ) => Result | undefined;
  matches: (node: t.Node) => boolean;
}

export interface Comment {
  node: t.CommentLine | t.CommentBlock;
  type: "xstate-ignore-next-line" | "xstate-layout";
}

export interface ParseResult {
  machines: MachineParseResult[];
  comments: Comment[];
  file: t.File | undefined;
}

export type DeclarationType = "named" | "inline" | "identifier" | "unknown";
