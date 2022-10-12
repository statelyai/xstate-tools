import * as t from '@babel/types';
import { AnyNode, BooleanLiteral } from './scalars';
import { unionType } from './unionType';

export const TsTypes = unionType<{ node: t.Node; value?: boolean }>([
  BooleanLiteral,
  AnyNode,
]);
