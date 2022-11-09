import * as t from '@babel/types';
import { AnyParser } from '.';
import { createParser } from './createParser';

export const TSTypeParameterInstantiation = <Result>(
  parser: AnyParser<Result>,
) =>
  createParser({
    babelMatcher: t.isTSTypeParameterInstantiation,
    parseNode: (node, context) => {
      return {
        node,
        params: node.params.map((param) => parser.parse(param, context)),
      };
    },
  });

export const TSType = createParser({
  babelMatcher: t.isTSType,
  parseNode: (node) => {
    return {
      node,
    };
  },
});

export const AnyTypeParameterList = TSTypeParameterInstantiation(TSType);
