import avoidContextSpread from "./avoid-context-spread";
import noCond from "./no-cond";
import noEmittedFrom from "./no-emitted-from";
import noFactoryContextArg from "./no-factory-context-arg";
import requireObjectContext from "./require-object-context";
import requireParameterizedActionsParams from "./require-parameterized-actions-params";
import requireParameterizedGuardsParams from "./require-parameterized-guards-params";

export default {
  "avoid-context-spread": avoidContextSpread,
  "no-cond": noCond,
  "no-emitted-from": noEmittedFrom,
  "no-factory-context-arg": noFactoryContextArg,
  "require-object-context": requireObjectContext,
  "require-parameterized-actions-params": requireParameterizedActionsParams,
  "require-parameterized-guards-params": requireParameterizedGuardsParams,
};
