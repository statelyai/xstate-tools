import * as t from '@babel/types';
import { MachineExtractResult } from './MachineExtractResult';

export type MaybeArray<T> = T | T[];

export type TransitionNodeConfig = {
  target?: MaybeArray<string>;
  actions?: MaybeArray<MachineAction>;
  internal?: boolean;
  cond?: string;
  description?: string;
};

export type InvokeNodeConfig = {
  src?: string | Function;
  id?: string;
  autoForward?: boolean;
  forward?: boolean;
  onDone?: MaybeArray<TransitionNodeConfig>;
  onError?: MaybeArray<TransitionNodeConfig>;
};

export type ExtractorStateNodeConfig = {
  id?: string;
  initial?: string;
  type?: string;
  entry?: MaybeArray<MachineAction>;
  onEntry?: MaybeArray<MachineAction>;
  exit?: MaybeArray<MachineAction>;
  onExit?: MaybeArray<MachineAction>;
  tags?: MaybeArray<string>;
  on?: Record<string, TransitionNodeConfig | string>;
  after?: Record<PropertyKey, TransitionNodeConfig | string>;
  always?: MaybeArray<TransitionNodeConfig | string>;
  history?: string | boolean;
  states?: Record<string, ExtractorStateNodeConfig>;
  meta?: Record<string, any>;
  invoke?: MaybeArray<InvokeNodeConfig | string>;
  description?: string;
  onDone?: MaybeArray<TransitionNodeConfig | string>;
};
export type ExtractorMachineConfig = ExtractorStateNodeConfig;

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
// export type ChooseAction = BaseBuiltinAction<{
//   conds: any[];
// }>;

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
  | ExtractorStopAction;

export type MachineAction = NamedAction | InlineAction | BuiltinAction;

// These types are copied over from studio blocks.
// array and object are extracted as expressions so Studio render them correctly when exporting
export type JsonItem =
  | string
  | number
  | bigint
  | boolean
  | null
  | JsonObject
  | JsonItem[];
export type JsonExpressionString = `{{${string}}}`;
export type JsonObject = { [key: string]: JsonItem };
