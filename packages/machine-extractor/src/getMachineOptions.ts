import { maybeIdentifierTo } from './identifiers';
import { StringLiteral } from './scalars';
import { maybeTsAsExpression } from './tsAsExpression';
import { objectTypeWithKnownKeys } from './utils';

const GetMachineOptionsObject = objectTypeWithKnownKeys({
  id: StringLiteral,
});

export const GetMachineOptions = maybeTsAsExpression(
  maybeIdentifierTo(GetMachineOptionsObject),
);
