import { Position } from "vscode-languageserver-textdocument";
import * as t from "@babel/types";
import { Location, StringLiteralNode } from "xstate-parser-demo";
import { MachineParseResult } from "xstate-parser-demo/lib/MachineParseResult";
import { StateNodeReturn } from "xstate-parser-demo/lib/stateNode";
import { DocumentValidationsResult } from "./server";

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
          name: action.action,
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
          name: guard.cond,
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
          name: service.service,
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
): { node: t.Node; action: string } | undefined => {
  let foundAction: { node: t.Node; action: string } | undefined = undefined;

  Object.values(parseResult?.getAllNamedActions() || {}).find((actions) => {
    const action = actions.find((action) =>
      isCursorInPosition(action.node.loc, position),
    );

    if (action && typeof action.action === "string") {
      foundAction = {
        node: action.node,
        action: action.action,
      };
    }
  });

  return foundAction;
};

const getGuardMatchingCursor = (
  parseResult: MachineParseResult | undefined,
  position: Position,
): { node: t.Node; cond: string } | undefined => {
  let foundGuard: { node: t.Node; cond: string } | undefined = undefined;

  Object.values(parseResult?.getAllNamedConds() || {}).find((conds) => {
    const cond = conds.find((cond) =>
      isCursorInPosition(cond.node.loc, position),
    );

    if (cond && typeof cond.cond === "string") {
      foundGuard = {
        cond: cond.cond,
        node: cond.node,
      };
    }
  });

  return foundGuard;
};

const getServiceMatchingCursor = (
  parseResult: MachineParseResult | undefined,
  position: Position,
): { node: t.Node; service: string } | undefined => {
  let foundService: { node: t.Node; service: string } | undefined = undefined;

  Object.values(parseResult?.getAllNamedServices() || {}).find((services) => {
    const service = services.find((service) =>
      isCursorInPosition(service.srcNode?.loc!, position),
    );

    if (service && typeof service.name === "string") {
      foundService = {
        node: service.srcNode!,
        service: service.name,
      };
    }
  });

  return foundService;
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

const isCursorInPosition = (
  nodeSourceLocation: Location,
  cursorPosition: Position,
) => {
  if (!nodeSourceLocation) return;
  const isOnSameLine =
    nodeSourceLocation.start.line - 1 === cursorPosition.line;

  if (!isOnSameLine) return false;

  const isWithinChars =
    cursorPosition.character >= nodeSourceLocation.start.column &&
    cursorPosition.character <= nodeSourceLocation.end.column;

  return isWithinChars;
};
