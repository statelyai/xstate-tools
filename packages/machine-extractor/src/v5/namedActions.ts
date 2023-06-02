import { cancel, log, pure, raise, sendParent, stop } from 'xstate5';
import { escalate } from 'xstate5/actions';
import type { ActionNode } from './actions';
import { AnyNode } from './scalars';
import { namedFunctionCall } from './utils';
import { wrapParserResult } from './wrapParserResult';

export const CancelAction = wrapParserResult(
  namedFunctionCall('cancel', AnyNode),
  (result, node, context): ActionNode => {
    return {
      node: result.node,
      action: cancel(''),
      name: '',
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
      name: '',
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
      name: '',
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
      name: '',
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
      name: '',
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
      name: '',
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
      name: '',
      declarationType: 'inline',
      inlineDeclarationId: context.getNodeHash(node),
    };
  },
);
