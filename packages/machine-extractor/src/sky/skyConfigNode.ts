import * as t from '@babel/types';
import { createParser } from '../createParser';
import { maybeIdentifierTo } from '../identifiers';
import { StringLiteral } from '../scalars';
import { maybeTsAsExpression } from '../tsAsExpression';
import { AnyParser, StringLiteralNode } from '../types';
import { unionType } from '../unionType';
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

const StringLiteralOrExpression = unionType([
  StringLiteral,
  maybeTsAsExpression(
    maybeIdentifierTo(
      createParser({
        babelMatcher: t.isMemberExpression,
        parseNode: (node, context): StringLiteralNode => {
          // If the user has passed the API key as an expression `process.env.API_KEY`, we need to evaluate it
          const source = context.getNodeSource?.(node) ?? '';
          return {
            value: eval(source),
            node,
          };
        },
      }),
    ),
  ),
]);

const SkyConfigNodeObject: AnyParser<SkyConfigNodeReturn> =
  objectTypeWithKnownKeys(() => ({
    url: StringLiteral,
    apiKey: StringLiteralOrExpression,
    xstateVersion: StringLiteral,
  }));

export const SkyNode = SkyConfigNodeObject;
