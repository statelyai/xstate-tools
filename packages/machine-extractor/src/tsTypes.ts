import { AnyNode, BooleanLiteral } from "./scalars";
import { unionType } from "./unionType";
import { wrapParserResult } from "./wrapParserResult";
import * as t from "@babel/types";

export const TsTypes = unionType<{ node: t.Node; value?: boolean }>([
  BooleanLiteral,
  AnyNode,
]);
