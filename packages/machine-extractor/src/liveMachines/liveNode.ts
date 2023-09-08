import * as t from '@babel/types';
import { StringLiteral } from '../scalars';
import { AnyParser } from '../types';
import {
  GetParserResult,
  ObjectPropertyInfo,
  objectTypeWithKnownKeys,
} from '../utils';

type WithValueNodes<T> = {
  [K in keyof T]: T[K] & { _valueNode?: t.Node };
};

export type LiveNodeReturn = WithValueNodes<{
  machineVersionId?: GetParserResult<typeof StringLiteral>;
  apiKey?: GetParserResult<typeof StringLiteral>;
}> &
  Pick<ObjectPropertyInfo, 'node'>;

const LiveNodeObject: AnyParser<LiveNodeReturn> = objectTypeWithKnownKeys(
  () => ({
    machineVersionId: StringLiteral,
    apiKey: StringLiteral,
  }),
);

export const LiveNode = LiveNodeObject;
