import * as t from "@babel/types";
import { Position } from "vscode-languageserver-textdocument";
import { StringLiteralNode } from "xstate-parser-demo";
import { MachineParseResult } from "xstate-parser-demo/src/MachineParseResult";
import { StateNodeReturn } from "xstate-parser-demo/src/stateNode";
import {
  DocumentValidationsResult,
  isCursorInPosition,
} from "xstate-vscode-shared";

export const getCursorHoverType = (
  validationResult: DocumentValidationsResult[],
  position: Position,
):
  | {
      type: "TARGET";
      machine: MachineParseResult;
      state: {
        path: string[];
        ast: StateNodeReturn;
      };
      target: StringLiteralNode;
    }
  | {
      type: "INITIAL";
      machine: MachineParseResult;
      state: {
        path: string[];
        ast: StateNodeReturn;
      };
      target: StringLiteralNode;
    }
  | {
      type: "ACTION";
      node: t.Node;
      name: string;
      machine: MachineParseResult;
    }
  | {
      type: "ACTION_IMPLEMENTATION";
      node: t.Node;
      name: string;
      machine: MachineParseResult;
    }
  | { type: "COND"; node: t.Node; name: string; machine: MachineParseResult }
  | {
      type: "COND_IMPLEMENTATION";
      node: t.Node;
      name: string;
      machine: MachineParseResult;
    }
  | { type: "SERVICE"; node: t.Node; name: string; machine: MachineParseResult }
  | {
      type: "SERVICE_IMPLEMENTATION";
      node: t.Node;
      name: string;
      machine: MachineParseResult;
    }
  | void => {
  for (const machine of validationResult) {
    for (const state of machine.parseResult?.getAllStateNodes() || []) {
      const target = getTargetMatchingCursor(machine.parseResult, position);
      if (target) {
        return {
          type: "TARGET",
          machine: machine.parseResult!,
          state,
          target,
        };
      }
      if (getInitialMatchingCursor(state.ast, position)) {
        return {
          type: "INITIAL",
          state,
          machine: machine.parseResult!,
          target: state.ast.initial!,
        };
      }
      const action = getActionMatchingCursor(machine.parseResult, position);
      if (action) {
        return {
          type: "ACTION",
          node: action.node,
          name: action.name,
          machine: machine.parseResult!,
        };
      }
      const actionImplementation = getActionImplementationMatchingCursor(
        machine.parseResult,
        position,
      );

      if (actionImplementation) {
        return {
          type: "ACTION_IMPLEMENTATION",
          node: actionImplementation.keyNode,
          name: actionImplementation.key,
          machine: machine.parseResult!,
        };
      }

      const guard = getGuardMatchingCursor(machine.parseResult, position);
      if (guard) {
        return {
          type: "COND",
          node: guard.node,
          name: guard.name,
          machine: machine.parseResult!,
        };
      }
      const guardImplementation = getGuardImplementationMatchingCursor(
        machine.parseResult,
        position,
      );

      if (guardImplementation) {
        return {
          type: "COND_IMPLEMENTATION",
          node: guardImplementation.keyNode,
          name: guardImplementation.key,
          machine: machine.parseResult!,
        };
      }

      const service = getServiceMatchingCursor(machine.parseResult, position);
      if (service) {
        return {
          type: "SERVICE",
          node: service.node,
          name: service.src,
          machine: machine.parseResult!,
        };
      }
      const serviceImplementation = getServiceImplementationMatchingCursor(
        machine.parseResult,
        position,
      );

      if (serviceImplementation) {
        return {
          type: "SERVICE_IMPLEMENTATION",
          node: serviceImplementation.keyNode,
          name: serviceImplementation.key,
          machine: machine.parseResult!,
        };
      }
    }
  }
};

const getTargetMatchingCursor = (
  parseResult: MachineParseResult | undefined,
  position: Position,
) => {
  for (const target of parseResult?.getTransitionTargets() || []) {
    for (const targetNode of target.target) {
      if (isCursorInPosition(targetNode.node.loc, position)) {
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
  return isCursorInPosition(state.initial.node.loc, position);
};

const getActionMatchingCursor = (
  parseResult: MachineParseResult | undefined,
  position: Position,
) => {
  return parseResult?.getAllActions(["named"]).find((action) => {
    return isCursorInPosition(action.node.loc, position);
  });
};

const getGuardMatchingCursor = (
  parseResult: MachineParseResult | undefined,
  position: Position,
) => {
  return parseResult?.getAllConds(["named"]).find((cond) => {
    return isCursorInPosition(cond.node.loc, position);
  });
};

const getServiceMatchingCursor = (
  parseResult: MachineParseResult | undefined,
  position: Position,
) => {
  return parseResult?.getAllServices(["named"]).find((service) => {
    return isCursorInPosition(service.srcNode?.loc!, position);
  });
};

const getActionImplementationMatchingCursor = (
  parseResult: MachineParseResult | undefined,
  position: Position,
) => {
  const actionImplementations =
    parseResult?.ast?.options?.actions?.properties.map((property) => {
      return property;
    });

  return actionImplementations?.find((implementation) => {
    return isCursorInPosition(implementation.keyNode.loc, position);
  });
};

const getGuardImplementationMatchingCursor = (
  parseResult: MachineParseResult | undefined,
  position: Position,
) => {
  const guardImplementations =
    parseResult?.ast?.options?.guards?.properties.map((property) => {
      return property;
    });

  return guardImplementations?.find((implementation) => {
    return isCursorInPosition(implementation.keyNode.loc, position);
  });
};

const getServiceImplementationMatchingCursor = (
  parseResult: MachineParseResult | undefined,
  position: Position,
) => {
  const serviceImplementations =
    parseResult?.ast?.options?.services?.properties.map((property) => {
      return property;
    });

  return serviceImplementations?.find((implementation) => {
    return isCursorInPosition(implementation.keyNode.loc, position);
  });
};
