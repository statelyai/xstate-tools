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
  url?: GetParserResult<typeof StringLiteral>;
  apiKey?: GetParserResult<typeof StringLiteral>;
  xstateVersion?: GetParserResult<typeof StringLiteral>;
}> &
  Pick<ObjectPropertyInfo, 'node'>;

const SkyConfigNodeObject: AnyParser<SkyConfigNodeReturn> =
  objectTypeWithKnownKeys(() => ({
    url: StringLiteral,
    apiKey: StringLiteral,
    xstateVersion: StringLiteral,
  }));

export const LiveNode = SkyConfigNodeObject;
