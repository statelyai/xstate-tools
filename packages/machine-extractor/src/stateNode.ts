import { types as t } from "@babel/core";
import { MaybeArrayOfActions } from "./actions";
import { Context } from "./context";
import { History } from "./history";
import { Invoke } from "./invoke";
import { StateMeta } from "./meta";
import {
  AnyNode,
  BooleanLiteral,
  NumericLiteral,
  StringLiteral,
} from "./scalars";
import { Schema } from "./schema";
import { MaybeTransitionArray } from "./transitions";
import { TsTypes } from "./tsTypes";
import { AnyParser } from "./types";
import {
  GetObjectKeysResult,
  GetParserResult,
  maybeArrayOf,
  objectOf,
  ObjectOfReturn,
  ObjectPropertyInfo,
  objectTypeWithKnownKeys,
} from "./utils";

const On = objectOf(MaybeTransitionArray);

const After = objectOf(MaybeTransitionArray);
const Tags = maybeArrayOf(StringLiteral);

/**
 * This is frustrating, but we need to keep this
 * up to date with the StateNode definition below.
 *
 * The reason? TS fails early when it hits a
 * recursive type definition, meaning our inference
 * falls out the window when StateNode tries to
 * reference itself
 */
export type StateNodeReturn = {
  id?: GetParserResult<typeof StringLiteral>;
  initial?: GetParserResult<typeof StringLiteral>;
  type?: GetParserResult<typeof StringLiteral>;
  delimiter?: GetParserResult<typeof StringLiteral>;
  entry?: GetParserResult<typeof MaybeArrayOfActions>;
  exit?: GetParserResult<typeof MaybeArrayOfActions>;
  onEntry?: GetParserResult<typeof MaybeArrayOfActions>;
  onExit?: GetParserResult<typeof MaybeArrayOfActions>;
  invoke?: GetParserResult<typeof Invoke>;
  always?: GetParserResult<typeof MaybeTransitionArray>;
  onDone?: GetParserResult<typeof MaybeTransitionArray>;
  on?: GetParserResult<typeof On>;
  after?: GetParserResult<typeof After>;
  history?: GetParserResult<typeof History>;
  tags?: GetParserResult<typeof Tags>;
  states?: GetParserResult<AnyParser<ObjectOfReturn<StateNodeReturn>>>;
  node: t.Node;
  meta?: GetParserResult<typeof StateMeta>;
  tsTypes?: GetParserResult<typeof TsTypes>;
  context?: GetParserResult<typeof Context>;
  data?: GetParserResult<typeof AnyNode>;
  schema?: GetParserResult<typeof Schema>;
  preserveActionOrder?: GetParserResult<typeof BooleanLiteral>;
  parallel?: GetParserResult<typeof BooleanLiteral>;
  description?: GetParserResult<typeof StringLiteral>;
  key?: GetParserResult<typeof StringLiteral>;
  version?: GetParserResult<typeof AnyNode>;
  activities?: GetParserResult<typeof AnyNode>;
  strict?: GetParserResult<typeof BooleanLiteral>;
  // TODO
  parent?: GetParserResult<typeof AnyNode>;
  order?: GetParserResult<typeof NumericLiteral>;
};

type WithObjectPropertyInfo<T extends Record<any, any>> = {
  [K in keyof T]: T[K] & ObjectPropertyInfo;
};

const StateNodeObject: AnyParser<WithObjectPropertyInfo<StateNodeReturn>> =
  objectTypeWithKnownKeys(() => ({
    id: StringLiteral,
    initial: StringLiteral,
    type: StringLiteral,
    tsTypes: TsTypes,
    schema: Schema,
    history: History,
    delimiter: StringLiteral,
    entry: MaybeArrayOfActions,
    exit: MaybeArrayOfActions,
    onEntry: MaybeArrayOfActions,
    onExit: MaybeArrayOfActions,
    invoke: Invoke,
    always: MaybeTransitionArray,
    onDone: MaybeTransitionArray,
    after: After,
    on: On,
    tags: Tags,
    states: objectOf(StateNodeObject),
    meta: StateMeta,
    context: Context,
    data: AnyNode,
    preserveActionOrder: BooleanLiteral,
    parallel: BooleanLiteral,
    description: StringLiteral,
    version: AnyNode,
    key: StringLiteral,
    activities: AnyNode,
    parent: AnyNode,
    strict: BooleanLiteral,
    order: NumericLiteral,
  }));

export const StateNode = StateNodeObject;
