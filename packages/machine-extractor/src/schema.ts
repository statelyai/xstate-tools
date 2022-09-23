import { AnyNode } from './scalars';
import { objectTypeWithKnownKeys } from './utils';

export const Schema = objectTypeWithKnownKeys({
  context: AnyNode,
  events: AnyNode,
  services: AnyNode,
});
