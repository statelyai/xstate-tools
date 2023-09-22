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

export type SkyConfigNodeReturn = WithValueNodes<{
  versionId?: GetParserResult<typeof StringLiteral>;
  apiKey?: GetParserResult<typeof StringLiteral>;
}> &
  Pick<ObjectPropertyInfo, 'node'>;

const SkyConfigNodeObject: AnyParser<SkyConfigNodeReturn> =
  objectTypeWithKnownKeys(() => ({
    versionId: StringLiteral,
    apiKey: StringLiteral,
  }));

export const LiveNode = SkyConfigNodeObject;
