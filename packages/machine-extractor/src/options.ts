import { maybeIdentifierTo } from "./identifiers";
import { AnyNode, BooleanLiteral } from "./scalars";
import { maybeTsAsExpression } from "./tsAsExpression";
import { objectOf, objectTypeWithKnownKeys } from "./utils";

const MachineOptionsObject = objectTypeWithKnownKeys({
  actions: objectOf(AnyNode),
  services: objectOf(AnyNode),
  guards: objectOf(AnyNode),
  delays: objectOf(AnyNode),
  devTools: BooleanLiteral,
});

export const MachineOptions = maybeTsAsExpression(
  maybeIdentifierTo(MachineOptionsObject),
);
