import * as t from '@babel/types';
import { ActionNode, ChooseAction } from './actions';
import { maybeIdentifierTo } from './identifiers';
import { AnyNode, BooleanLiteral } from './scalars';
import { maybeTsAsExpression } from './tsAsExpression';
import { unionType } from './unionType';
import { objectOf, objectTypeWithKnownKeys } from './utils';

const MachineOptionsObject = objectTypeWithKnownKeys({
  actions: objectOf(
    unionType<ActionNode | { node: t.Node }>([ChooseAction, AnyNode]),
  ),
  services: objectOf(AnyNode),
  guards: objectOf(AnyNode),
  delays: objectOf(AnyNode),
  devTools: BooleanLiteral,
});

export const MachineOptions = maybeTsAsExpression(
  maybeIdentifierTo(MachineOptionsObject),
);
