import * as t from '@babel/types';
import { MaybeArrayOfActions } from './actions';
import { Context } from './context';
import { History } from './history';
import { Invoke } from './invoke';
import { StateMeta } from './meta';
import {
  AnyNode,
  BooleanLiteral,
  StringLiteral,
  TemplateLiteral,
} from './scalars';
import { Schema } from './schema';
import { MaybeTransitionArray } from './transitions';
import { TsTypes } from './tsTypes';
import { AnyParser } from './types';
import { unionType } from './unionType';
import {
  GetParserResult,
  maybeArrayOf,
  objectOf,
  ObjectOfReturn,
  ObjectPropertyInfo,
  objectTypeWithKnownKeys,
} from './utils';

const On = objectOf(MaybeTransitionArray);

const After = objectOf(MaybeTransitionArray);
const Tags = maybeArrayOf(StringLiteral);

type WithValueNodes<T> = {
  [K in keyof T]: T[K] & { _valueNode?: t.Node };
};

/**
 * This is frustrating, but we need to keep this
 * up to date with the StateNode definition below.
 *
 * The reason? TS fails early when it hits a
 * recursive type definition, meaning our inference
 * falls out the window when StateNode tries to
 * reference itself
 */
export type StateNodeReturn = WithValueNodes<{
  id?: GetParserResult<typeof StringLiteral>;
  initial?: GetParserResult<typeof StringLiteral>;
  type?: GetParserResult<typeof StringLiteral>;
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
  meta?: GetParserResult<typeof StateMeta>;
  data?: GetParserResult<typeof AnyNode>;
  parallel?: GetParserResult<typeof BooleanLiteral>;
  description?: GetParserResult<typeof StringLiteral>;
  activities?: GetParserResult<typeof AnyNode>;

  // those should only be allowed at the root level
  tsTypes?: GetParserResult<typeof TsTypes>;
  schema?: GetParserResult<typeof Schema>;
  context?: GetParserResult<typeof Context>;
  preserveActionOrder?: GetParserResult<typeof BooleanLiteral>;
  predictableActionArguments?: GetParserResult<typeof BooleanLiteral>;
  strict?: GetParserResult<typeof BooleanLiteral>;
  version?: GetParserResult<typeof AnyNode>;
  delimiter?: GetParserResult<typeof StringLiteral>;
  key?: GetParserResult<typeof StringLiteral>;
}> &
  Pick<ObjectPropertyInfo, 'node'>;

const StateNodeObject: AnyParser<StateNodeReturn> = objectTypeWithKnownKeys(
  () => ({
    id: StringLiteral,
    initial: StringLiteral,
    type: StringLiteral,
    history: History,
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
    data: AnyNode,
    parallel: BooleanLiteral,
    description: unionType([StringLiteral, TemplateLiteral]),
    activities: AnyNode,

    // those should only be allowed at the root level
    tsTypes: TsTypes,
    schema: Schema,
    context: Context,
    preserveActionOrder: BooleanLiteral,
    predictableActionArguments: BooleanLiteral,
    strict: BooleanLiteral,
    version: AnyNode,
    delimiter: StringLiteral,
    key: StringLiteral,
  }),
);

export const StateNode = StateNodeObject;
