import { StringLiteral, TemplateLiteral } from './scalars';
import { unionType } from './unionType';
import { objectOf } from './utils';

export const MetaValues = unionType([StringLiteral, TemplateLiteral]);

export const StateMeta = objectOf(MetaValues);
