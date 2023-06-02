import { StringLiteral, TemplateLiteral } from './scalars';
import { unionType } from './unionType';
import { objectTypeWithKnownKeys } from './utils';

export const MetaDescription = unionType([StringLiteral, TemplateLiteral]);

export const StateMeta = objectTypeWithKnownKeys({
  description: MetaDescription,
});
