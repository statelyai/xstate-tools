import * as t from '@babel/types';
import { Action } from 'xstate';
import { MachineExtractResult } from './MachineExtractResult';

export type MaybeArray<T> = T | T[];

export type ExtractrorTransitionNodeConfig = {
  target?: MaybeArray<string>;
  actions?: MaybeArray<ExtractorMachineAction>;
  internal?: boolean;
  cond?: string;
  description?: string;
  meta?: Record<string, any>;
};

export type ExtractorInvokeNodeConfig = {
  src?: string | Function;
  id?: string;
  autoForward?: boolean;
  forward?: boolean;
  onDone?: MaybeArray<ExtractrorTransitionNodeConfig>;
  onError?: MaybeArray<ExtractrorTransitionNodeConfig>;
};

export type ExtractorStateNodeConfig = {
  id?: string;
  initial?: string;
  type?: 'parallel' | 'history' | 'final';
  entry?: MaybeArray<ExtractorMachineAction>;
  onEntry?: MaybeArray<ExtractorMachineAction>;
  exit?: MaybeArray<ExtractorMachineAction>;
  onExit?: MaybeArray<ExtractorMachineAction>;
  tags?: MaybeArray<string>;
  on?: Record<string, MaybeArray<ExtractrorTransitionNodeConfig>>;
  after?: Record<PropertyKey, MaybeArray<ExtractrorTransitionNodeConfig>>;
  always?: MaybeArray<ExtractrorTransitionNodeConfig>;
  history?: 'shallow' | 'deep' | boolean;
  states?: Record<string, ExtractorStateNodeConfig>;
  meta?: Record<string, any>;
  invoke?: MaybeArray<ExtractorInvokeNodeConfig>;
  description?: string;
  onDone?: MaybeArray<ExtractrorTransitionNodeConfig>;
};
export type ExtractorMachineConfig = ExtractorStateNodeConfig & {
  predictableActionArguments?: boolean;
  preserveActionOrder?: boolean;
};

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

export type DeclarationType =
  | 'named'
  | 'inline'
  | 'identifier'
  | 'object'
  | 'unknown';

type BaseBuiltinAction<P extends object> = {
  kind: 'builtin';
  action: { type: string } & P;
};
export type ExtractorAssignAction = BaseBuiltinAction<{
  assignment:
    | Record<string, JsonItem | JsonExpressionString>
    | JsonExpressionString;
}>;
export type ExtractorRaiseAction = BaseBuiltinAction<{
  event: Record<string, JsonItem> | JsonExpressionString;
}>;
export type ExtractedLogAction = BaseBuiltinAction<{
  expr: string | JsonExpressionString;
}>;
export type ExtractorSendToAction = BaseBuiltinAction<{
  event: JsonExpressionString | Record<string, JsonItem>;
  to: string | JsonExpressionString;
  id?: string | JsonExpressionString;
  delay?: string | number | JsonExpressionString;
}>;
export type ExtractorStopAction = BaseBuiltinAction<{
  id: string | JsonExpressionString;
}>;
export type ExtractorChooseAction = BaseBuiltinAction<{
  conds: {
    actions: Action<any, any>[];
    cond?: string | JsonExpressionString;
  }[];
}>;

export type NamedAction = {
  kind: 'named';
  action: { type: string; params?: JsonObject };
};
export type InlineAction = {
  kind: 'inline';
  action: { expr: JsonExpressionString };
};
export type BuiltinAction =
  | ExtractorAssignAction
  | ExtractorRaiseAction
  | ExtractedLogAction
  | ExtractorSendToAction
  | ExtractorStopAction
  | ExtractorChooseAction;

export type ExtractorMachineAction = NamedAction | InlineAction | BuiltinAction;

// These types are copied over from studio blocks.
// array and object are extracted as expressions so Studio render them correctly when exporting
export type JsonItem =
  | string
  | number
  | boolean
  | null
  | JsonObject
  | JsonItem[];
export type JsonExpressionString = `{{${string}}}`;
export type JsonObject = { [key: string]: JsonItem };
