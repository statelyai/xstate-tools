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

const StringLiteralOrEnvKey = unionType([
  StringLiteral,
  maybeTsAsExpression(
    maybeIdentifierTo(
      createParser({
        babelMatcher: t.isMemberExpression,
        parseNode: (node, context): StringLiteralNode => {
          if (!context.getNodeSource || !context.getEnvVariable) {
            throw new Error("Couldn't find API key in any of the env files");
          }

          // Let's find the env key, e.g. `API_KEY` in `process.env.API_KEY` or in `import.meta.env.API_KEY`
          const envVariableName =
            (t.buildMatchMemberExpression('process.env')(node.object) ||
              (t.isMemberExpression(node.object) &&
                t.isMetaProperty(node.object.object) &&
                t.isIdentifier(node.object.property) &&
                node.object.property.name === 'env')) &&
            t.isIdentifier(node.property)
              ? node.property.name
              : null;

          if (envVariableName) {
            const value = context.getEnvVariable(envVariableName);
            if (!value) {
              throw new Error("Couldn't find API key in any of the env files");
            }
            return { value, node };
          } else {
            throw new Error(
              'Invalid API key, we support strings or reading from process.env.YOUR_KEY_HERE',
            );
          }
        },
      }),
    ),
  ),
]);

const SkyConfigNodeObject: AnyParser<SkyConfigNodeReturn> =
  objectTypeWithKnownKeys(() => ({
    url: StringLiteral,
    apiKey: StringLiteralOrEnvKey,
    xstateVersion: StringLiteral,
  }));

export const SkyNode = SkyConfigNodeObject;
