import { NodePath, types as t } from "@babel/core";
import { Action, ChooseCondition } from "xstate";
import { assign, choose, forwardTo, send } from "xstate/lib/actions";
import { Cond, CondNode } from "./conds";
import { createParser } from "./createParser";
import { maybeIdentifierTo } from "./identifiers";
import {
  AfterAction,
  CancelAction,
  DoneAction,
  EscalateAction,
  LogAction,
  PureAction,
  RaiseAction,
  RespondAction,
  SendParentAction,
  SendUpdateAction,
  StartAction,
  StopAction,
} from "./namedActions";
import { AnyNode, NumericLiteral, StringLiteral } from "./scalars";
import { maybeTsAsExpression } from "./tsAsExpression";
import { DeclarationType } from "./types";
import { unionType } from "./unionType";
import {
  arrayOf,
  isFunctionOrArrowFunctionExpression,
  maybeArrayOf,
  namedFunctionCall,
  objectTypeWithKnownKeys,
} from "./utils";
import { wrapParserResult } from "./wrapParserResult";

export interface ActionNode {
  node: t.Node;
  path: NodePath<t.Node>;
  action: Action<any, any>;
  name: string;
  chooseConditions?: ParsedChooseCondition[];
  declarationType: DeclarationType;
  inlineDeclarationId: string;
}

export interface ParsedChooseCondition {
  condition: ChooseCondition<any, any>;
  actionNodes: ActionNode[];
  conditionNode?: CondNode;
}

export const ActionAsIdentifier = maybeTsAsExpression(
  createParser({
    babelMatcher: t.isIdentifier,
    parseNode: (path, context): ActionNode => {
      return {
        action: path.node.name,
        node: path.node,
        path,
        name: path.node.name,
        declarationType: "identifier",
        inlineDeclarationId: context.getNodeHash(path.node),
      };
    },
  })
);

export const ActionAsFunctionExpression = maybeTsAsExpression(
  maybeIdentifierTo(
    createParser({
      babelMatcher: isFunctionOrArrowFunctionExpression,
      parseNode: (path, context): ActionNode => {
        const action = function actions() {};
        const id = context.getNodeHash(path.node);

        action.toJSON = () => id;
        return {
          node: path.node,
          path,
          action,
          name: "",
          declarationType: "inline",
          inlineDeclarationId: id,
        };
      },
    })
  )
);

export const ActionAsString = maybeTsAsExpression(
  maybeIdentifierTo(
    createParser({
      babelMatcher: t.isStringLiteral,
      parseNode: (path, context): ActionNode => {
        return {
          path,
          action: path.node.value,
          node: path.node,
          name: path.node.value,
          declarationType: "named",
          inlineDeclarationId: context.getNodeHash(path.node),
        };
      },
    })
  )
);

export const ActionAsNode = createParser({
  babelMatcher: t.isNode,
  parseNode: (path, context): ActionNode => {
    const id = context.getNodeHash(path.node);
    return {
      path,
      action: id,
      node: path.node,
      name: "",
      declarationType: "unknown",
      inlineDeclarationId: id,
    };
  },
});

const ChooseFirstArg = arrayOf(
  objectTypeWithKnownKeys({
    cond: Cond,
    // Don't allow choose inside of choose for now,
    // too recursive
    // TODO - fix
    actions: maybeArrayOf(ActionAsString),
  })
);

export const ChooseAction = wrapParserResult(
  namedFunctionCall("choose", ChooseFirstArg),
  (result, path, context): ActionNode => {
    const conditions: ParsedChooseCondition[] = [];

    result.argument1Result?.forEach((arg1Result) => {
      const toPush: typeof conditions[number] = {
        condition: {
          actions: [],
        },
        actionNodes: [],
      };
      if (arg1Result.actions) {
        const actionResult = arg1Result.actions.map((action) => action.action);

        if (actionResult.length === 1) {
          toPush.condition.actions = actionResult[0];
        } else {
          toPush.condition.actions = actionResult;
        }
        toPush.actionNodes = arg1Result.actions;
      }
      if (arg1Result.cond) {
        toPush.condition.cond = arg1Result.cond.cond;
        toPush.conditionNode = arg1Result.cond;
      }
      conditions.push(toPush);
    });

    return {
      path,
      node: path.node,
      action: choose(conditions.map((condition) => condition.condition)),
      chooseConditions: conditions,
      name: "",
      declarationType: "inline",
      inlineDeclarationId: context.getNodeHash(path.node),
    };
  }
);

interface AssignFirstArg {
  path: NodePath<t.Node>;
  node: t.Node;
  value: {} | (() => {});
}

const AssignFirstArgObject = createParser({
  babelMatcher: t.isObjectExpression,
  parseNode: (path, context) => {
    return {
      path,
      node: path.node,
      value: {},
    };
  },
});

const AssignFirstArgFunction = createParser({
  babelMatcher: isFunctionOrArrowFunctionExpression,
  parseNode: (path, context) => {
    const value = function anonymous() {
      return {};
    };
    value.toJSON = () => {
      return {};
    };

    return {
      path,
      node: path.node,
      value,
    };
  },
});

const AssignFirstArg = unionType<AssignFirstArg>([
  AssignFirstArgObject,
  AssignFirstArgFunction,
]);

export const AssignAction = wrapParserResult(
  namedFunctionCall("assign", AssignFirstArg),
  (result, path, context): ActionNode => {
    const defaultAction = function anonymous() {
      return {};
    };
    defaultAction.toJSON = () => {
      return {};
    };

    return {
      path,
      node: result.node,
      action: assign(result.argument1Result?.value || defaultAction),
      name: "",
      declarationType: "inline",
      inlineDeclarationId: context.getNodeHash(path.node),
    };
  }
);

export const SendActionSecondArg = objectTypeWithKnownKeys({
  to: StringLiteral,
  delay: unionType<{ node: t.Node; value: string | number }>([
    NumericLiteral,
    StringLiteral,
  ]),
  id: StringLiteral,
});

export const SendAction = wrapParserResult(
  namedFunctionCall(
    "send",
    unionType<{ node: t.Node; value?: string }>([StringLiteral, AnyNode]),
    SendActionSecondArg
  ),
  (result, path, context): ActionNode => {
    return {
      path,
      node: result.node,
      name: "",
      action: send(
        result.argument1Result?.value ??
          (() => {
            return {
              type: "UNDEFINED",
            };
          }),
        {
          id: result.argument2Result?.id?.value,
          to: result.argument2Result?.to?.value,
          delay: result.argument2Result?.delay?.value,
        }
      ),
      declarationType: "inline",
      inlineDeclarationId: context.getNodeHash(path.node),
    };
  }
);

export const ForwardToActionSecondArg = objectTypeWithKnownKeys({
  to: StringLiteral,
});

export const ForwardToAction = wrapParserResult(
  namedFunctionCall("forwardTo", StringLiteral, ForwardToActionSecondArg),
  (result, path, context): ActionNode => {
    return {
      node: result.node,
      action: forwardTo(result.argument1Result?.value || "", {
        to: result.argument2Result?.to?.value,
      }),
      path,
      name: "",
      declarationType: "inline",
      inlineDeclarationId: context.getNodeHash(path.node),
    };
  }
);

const NamedAction = unionType([
  ChooseAction,
  AssignAction,
  SendAction,
  ForwardToAction,
  AfterAction,
  CancelAction,
  DoneAction,
  EscalateAction,
  LogAction,
  PureAction,
  RaiseAction,
  RespondAction,
  SendUpdateAction,
  StartAction,
  StopAction,
  SendParentAction,
]);

const BasicAction = unionType([
  ActionAsFunctionExpression,
  ActionAsString,
  ActionAsIdentifier,
  ActionAsNode,
]);

export const ArrayOfBasicActions = maybeArrayOf(BasicAction);

export const MaybeArrayOfActions = maybeArrayOf(
  unionType([NamedAction, BasicAction])
);
