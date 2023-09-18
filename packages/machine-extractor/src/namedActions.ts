import * as t from '@babel/types';
import {
  after,
  cancel,
  done,
  escalate,
  log,
  pure,
  raise,
  respond,
  sendParent,
  sendUpdate,
  start,
  stop,
} from 'xstate/lib/actions';
import type { ActionNode } from './actions';
import { AnyNode, NumericLiteral, StringLiteral } from './scalars';
import { unionType } from './unionType';
import { namedFunctionCall } from './utils';
import { wrapParserResult } from './wrapParserResult';

export const AfterAction = wrapParserResult(
  namedFunctionCall(
    'after',
    unionType<{ node: t.Node; value: number | string }>([
      StringLiteral,
      NumericLiteral,
    ]),
  ),
  (result, node, context): ActionNode => {
    return {
      node: result.node,
      action: after(result.argument1Result?.value || ''),
      name: 'after',
      kind: 'inline', // TODO: change when Studio has special UI form for this action and it's included in SUPPORTED_BUILTIN_ACTIONS
      declarationType: 'inline',
      inlineDeclarationId: context.getNodeHash(node),
    };
  },
);

export const CancelAction = wrapParserResult(
  namedFunctionCall('cancel', AnyNode),
  (result, node, context): ActionNode => {
    return {
      node: result.node,
      action: cancel(''),
      name: 'cancel',
      kind: 'inline', // TODO: change when Studio has special UI form for this action and it's included in SUPPORTED_BUILTIN_ACTIONS
      declarationType: 'inline',
      inlineDeclarationId: context.getNodeHash(node),
    };
  },
);

export const DoneAction = wrapParserResult(
  namedFunctionCall('done', AnyNode),
  (result, node, context): ActionNode => {
    return {
      node: result.node,
      action: done(''),
      name: 'done',
      kind: 'inline', // TODO: change when Studio has special UI form for this action and it's included in SUPPORTED_BUILTIN_ACTIONS
      declarationType: 'inline',
      inlineDeclarationId: context.getNodeHash(node),
    };
  },
);

export const EscalateAction = wrapParserResult(
  namedFunctionCall('escalate', AnyNode),
  (result, node, context): ActionNode => {
    return {
      node: result.node,
      action: escalate(''),
      name: 'escalate',
      kind: 'inline', // TODO: change when Studio has special UI form for this action and it's included in SUPPORTED_BUILTIN_ACTIONS
      declarationType: 'inline',
      inlineDeclarationId: context.getNodeHash(node),
    };
  },
);

export const LogAction = wrapParserResult(
  namedFunctionCall('log', AnyNode),
  (result, node, context): ActionNode => {
    return {
      node: result.node,
      action: log(),
      name: 'log',
      kind: 'builtin',
      declarationType: 'inline',
      inlineDeclarationId: context.getNodeHash(node),
    };
  },
);

export const PureAction = wrapParserResult(
  namedFunctionCall('pure', AnyNode),
  (result, node, context): ActionNode => {
    return {
      node: result.node,
      action: pure(() => []),
      name: 'pure',
      kind: 'inline', // TODO: change when Studio has special UI form for this action and it's included in SUPPORTED_BUILTIN_ACTIONS
      declarationType: 'inline',
      inlineDeclarationId: context.getNodeHash(node),
    };
  },
);

export const RaiseAction = wrapParserResult(
  namedFunctionCall('raise', AnyNode),
  (result, node, context): ActionNode => {
    return {
      node: result.node,
      action: raise(''),
      name: 'raise',
      kind: 'builtin',
      declarationType: 'inline',
      inlineDeclarationId: context.getNodeHash(node),
    };
  },
);

export const RespondAction = wrapParserResult(
  namedFunctionCall('respond', AnyNode),
  (result, node, context): ActionNode => {
    return {
      node: result.node,
      action: respond(''),
      name: 'respond',
      kind: 'inline', // TODO: change when Studio has special UI form for this action and it's included in SUPPORTED_BUILTIN_ACTIONS
      declarationType: 'inline',
      inlineDeclarationId: context.getNodeHash(node),
    };
  },
);

export const SendParentAction = wrapParserResult(
  namedFunctionCall('sendParent', AnyNode),
  (result, node, context): ActionNode => {
    return {
      node: result.node,
      action: sendParent(''),
      name: 'sendParent',
      kind: 'inline', // TODO: change when Studio has special UI form for this action and it's included in SUPPORTED_BUILTIN_ACTIONS
      declarationType: 'inline',
      inlineDeclarationId: context.getNodeHash(node),
    };
  },
);

export const SendUpdateAction = wrapParserResult(
  namedFunctionCall('sendUpdate', AnyNode),
  (result, node, context): ActionNode => {
    return {
      node: result.node,
      action: sendUpdate(),
      name: 'sendUpdate',
      kind: 'inline', // TODO: change when Studio has special UI form for this action and it's included in SUPPORTED_BUILTIN_ACTIONS
      declarationType: 'inline',
      inlineDeclarationId: context.getNodeHash(node),
    };
  },
);

export const StartAction = wrapParserResult(
  namedFunctionCall('start', AnyNode),
  (result, node, context): ActionNode => {
    return {
      node: result.node,
      action: start(''),
      name: 'start',
      kind: 'inline', // TODO: change when Studio has special UI form for this action and it's included in SUPPORTED_BUILTIN_ACTIONS
      declarationType: 'inline',
      inlineDeclarationId: context.getNodeHash(node),
    };
  },
);

export const StopAction = wrapParserResult(
  namedFunctionCall('stop', AnyNode),
  (result, node, context): ActionNode => {
    return {
      node: result.node,
      action: stop(''),
      name: 'stop',
      kind: 'builtin',
      declarationType: 'inline',
      inlineDeclarationId: context.getNodeHash(node),
    };
  },
);
