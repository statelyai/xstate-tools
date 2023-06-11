import * as t from '@babel/types';
import {
  MachineExtractResult,
  StateNodeReturn,
  StringLiteralNode,
} from '@xstate/machine-extractor';
import { isCursorInPosition } from '@xstate/tools-shared';
import { Position } from 'vscode-languageserver-textdocument';
import { ExtractionResult } from './types';

export const getCursorHoverType = (
  extractionResults: ExtractionResult[],
  position: Position,
):
  | {
      type: 'TARGET';
      machine: MachineExtractResult;
      state: {
        path: string[];
        ast: StateNodeReturn;
      };
      target: StringLiteralNode;
    }
  | {
      type: 'INITIAL';
      machine: MachineExtractResult;
      state: {
        path: string[];
        ast: StateNodeReturn;
      };
      target: StringLiteralNode;
    }
  | {
      type: 'ACTION';
      node: t.Node;
      name: string;
      machine: MachineExtractResult;
    }
  | {
      type: 'ACTION_IMPLEMENTATION';
      node: t.Node;
      name: string;
      machine: MachineExtractResult;
    }
  | { type: 'COND'; node: t.Node; name: string; machine: MachineExtractResult }
  | {
      type: 'COND_IMPLEMENTATION';
      node: t.Node;
      name: string;
      machine: MachineExtractResult;
    }
  | {
      type: 'SERVICE';
      node: t.Node;
      name: string;
      machine: MachineExtractResult;
    }
  | {
      type: 'SERVICE_IMPLEMENTATION';
      node: t.Node;
      name: string;
      machine: MachineExtractResult;
    }
  | void => {
  for (const { machineResult } of extractionResults) {
    if (!machineResult) {
      continue;
    }
    for (const state of machineResult.getAllStateNodes() || []) {
      const target = getTargetMatchingCursor(machineResult, position);
      if (target) {
        return {
          type: 'TARGET',
          machine: machineResult,
          state,
          target,
        };
      }
      if (getInitialMatchingCursor(state.ast, position)) {
        return {
          type: 'INITIAL',
          state,
          machine: machineResult,
          target: state.ast.initial!,
        };
      }
      const action = getActionMatchingCursor(machineResult, position);
      if (action) {
        return {
          type: 'ACTION',
          node: action.node,
          name: action.name,
          machine: machineResult,
        };
      }
      const actionImplementation = getActionImplementationMatchingCursor(
        machineResult,
        position,
      );

      if (actionImplementation) {
        return {
          type: 'ACTION_IMPLEMENTATION',
          node: actionImplementation.keyNode,
          name: actionImplementation.key,
          machine: machineResult,
        };
      }

      const guard = getGuardMatchingCursor(machineResult, position);
      if (guard) {
        return {
          type: 'COND',
          node: guard.node,
          name: guard.name,
          machine: machineResult,
        };
      }
      const guardImplementation = getGuardImplementationMatchingCursor(
        machineResult,
        position,
      );

      if (guardImplementation) {
        return {
          type: 'COND_IMPLEMENTATION',
          node: guardImplementation.keyNode,
          name: guardImplementation.key,
          machine: machineResult,
        };
      }

      const service = getServiceMatchingCursor(machineResult, position);
      if (service) {
        return {
          type: 'SERVICE',
          node: service.node,
          name: service.src,
          machine: machineResult,
        };
      }
      const serviceImplementation = getServiceImplementationMatchingCursor(
        machineResult,
        position,
      );

      if (serviceImplementation) {
        return {
          type: 'SERVICE_IMPLEMENTATION',
          node: serviceImplementation.keyNode,
          name: serviceImplementation.key,
          machine: machineResult,
        };
      }
    }
  }
};

const getTargetMatchingCursor = (
  parseResult: MachineExtractResult | undefined,
  position: Position,
) => {
  for (const target of parseResult?.getTransitionTargets() || []) {
    for (const targetNode of target.target) {
      if (isCursorInPosition(targetNode.node.loc!, position)) {
        return targetNode;
      }
    }
  }
};

const getInitialMatchingCursor = (
  state: StateNodeReturn,
  position: Position,
) => {
  if (!state.initial) return;
  return isCursorInPosition(state.initial.node.loc!, position);
};

const getActionMatchingCursor = (
  parseResult: MachineExtractResult | undefined,
  position: Position,
) => {
  return parseResult?.getAllActions(['named']).find((action) => {
    return isCursorInPosition(action.node.loc!, position);
  });
};

const getGuardMatchingCursor = (
  parseResult: MachineExtractResult | undefined,
  position: Position,
) => {
  return parseResult?.getAllConds(['named']).find((cond) => {
    return isCursorInPosition(cond.node.loc!, position);
  });
};

const getServiceMatchingCursor = (
  parseResult: MachineExtractResult | undefined,
  position: Position,
) => {
  return parseResult?.getAllServices(['named']).find((service) => {
    return isCursorInPosition(service.srcNode!.loc!, position);
  });
};

const getActionImplementationMatchingCursor = (
  parseResult: MachineExtractResult | undefined,
  position: Position,
) => {
  const actionImplementations =
    parseResult?.machineCallResult?.options?.actions?.properties.map(
      (property) => {
        return property;
      },
    );

  return actionImplementations?.find((implementation) => {
    return isCursorInPosition(implementation.keyNode.loc!, position);
  });
};

const getGuardImplementationMatchingCursor = (
  parseResult: MachineExtractResult | undefined,
  position: Position,
) => {
  const guardImplementations =
    parseResult?.machineCallResult?.options?.guards?.properties.map(
      (property) => {
        return property;
      },
    );

  return guardImplementations?.find((implementation) => {
    return isCursorInPosition(implementation.keyNode.loc!, position);
  });
};

const getServiceImplementationMatchingCursor = (
  parseResult: MachineExtractResult | undefined,
  position: Position,
) => {
  const serviceImplementations =
    parseResult?.machineCallResult?.options?.services?.properties.map(
      (property) => {
        return property;
      },
    );

  return serviceImplementations?.find((implementation) => {
    return isCursorInPosition(implementation.keyNode.loc!, position);
  });
};
