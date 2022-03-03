import { AnyNode, BooleanLiteral } from "./scalars";
import { unionType } from "./unionType";
import { wrapParserResult } from "./wrapParserResult";
import { types as t } from "@babel/core";

export const TsTypes = unionType<{ node: t.Node; value?: boolean }>([
  BooleanLiteral,
  AnyNode,
]);
