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
      target:
        | {
            fromPath: string[];
            target: StringLiteralNode;
          }
        | undefined;
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
    }
  }
};

const getTargetMatchingCursor = (
  parseResult: MachineParseResult | undefined,
  position: Position,
) => {
  return parseResult?.getTransitionTargets().find((target) => {
    return isCursorInPosition(target.target.node.loc, position);
  });
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
  let foundAction: { node: t.Node } | undefined = undefined;

  Object.values(parseResult?.getAllNamedActions() || {}).find((actions) => {
    const action = actions.find((action) =>
      isCursorInPosition(action.node.loc, position),
    );

    if (action && typeof action.action === "string") {
      foundAction = action;
    }
  });

  return foundAction;
};

const getActionImplementationMatchingCursor = (
  parseResult: MachineParseResult | undefined,
  position: Position,
) => {
  let foundAction: { node: t.Node } | undefined = undefined;

  const actionImplementations =
    parseResult?.ast?.options?.actions?.properties.map((property) => {
      return property;
    });

  return actionImplementations?.find((implementation) => {
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
