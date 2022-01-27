import { TextDocumentIdentifier } from "vscode-languageserver";
import { Position, Range } from "vscode-languageserver-textdocument";
import { createMachine } from "xstate";
import { getCursorHoverType } from "./getCursorHoverType";
import {
  DocumentValidationsResult,
  getRangeFromSourceLocation,
} from "xstate-vscode-shared";

export const getReferences = (params: {
  textDocument: TextDocumentIdentifier;
  position: Position;
  machinesParseResult: DocumentValidationsResult[];
}): { uri: string; range: Range }[] => {
  const cursorHover = getCursorHoverType(
    params.machinesParseResult,
    params.position,
  );

  try {
    if (cursorHover?.type === "TARGET") {
      const config = cursorHover.machine.toConfig();
      if (!config) return [];

      const fullMachine = createMachine(config);

      const state = fullMachine.getStateNodeByPath(cursorHover.state.path);

      // @ts-ignore
      const targetStates: { id: string }[] = state.resolveTarget([
        cursorHover.target?.value,
      ]);

      if (!targetStates) {
        return [];
      }

      const resolvedTargetState = state.getStateNodeById(targetStates[0].id);

      const node = cursorHover.machine.getStateNodeByPath(
        resolvedTargetState.path,
      );

      if (!node?.ast.node.loc) {
        return [];
      }

      return [
        {
          uri: params.textDocument.uri,
          range: getRangeFromSourceLocation(node.ast.node.loc),
        },
      ];
    }
    if (cursorHover?.type === "INITIAL") {
      const config = cursorHover.machine.toConfig();
      if (!config) return [];
      const fullMachine = createMachine(config);

      const state = fullMachine.getStateNodeByPath(cursorHover.state.path);

      const targetState = state.states[cursorHover.target.value];

      if (!targetState) {
        return [];
      }

      const node = cursorHover.machine.getStateNodeByPath(targetState.path);

      if (!node?.ast.node.loc) {
        return [];
      }

      return [
        {
          uri: params.textDocument.uri,
          range: getRangeFromSourceLocation(node.ast.node.loc),
        },
      ];
    }
    if (cursorHover?.type === "ACTION") {
      const node = cursorHover.machine.getActionImplementation(
        cursorHover.name,
      );

      if (node?.keyNode.loc) {
        return [
          {
            uri: params.textDocument.uri,
            range: getRangeFromSourceLocation(node.keyNode.loc),
          },
        ];
      }
    } else if (cursorHover?.type === "ACTION_IMPLEMENTATION") {
      const actions = cursorHover.machine
        .getAllConds(["named"])
        .filter((elem) => elem.name === cursorHover.name);

      return actions.map((action) => {
        return {
          uri: params.textDocument.uri,
          range: getRangeFromSourceLocation(action.node.loc!),
        };
      });
    }

    if (cursorHover?.type === "COND") {
      const node = cursorHover.machine.getGuardImplementation(cursorHover.name);

      if (node?.keyNode.loc) {
        return [
          {
            uri: params.textDocument.uri,
            range: getRangeFromSourceLocation(node.keyNode.loc),
          },
        ];
      }
    } else if (cursorHover?.type === "COND_IMPLEMENTATION") {
      const guards = cursorHover.machine
        .getAllConds(["named"])
        .filter((elem) => elem.name === cursorHover.name);

      return guards.map((guard) => {
        return {
          uri: params.textDocument.uri,
          range: getRangeFromSourceLocation(guard.node.loc!),
        };
      });
    }
    if (cursorHover?.type === "SERVICE") {
      const node = cursorHover.machine.getServiceImplementation(
        cursorHover.name,
      );

      if (node?.keyNode.loc) {
        return [
          {
            uri: params.textDocument.uri,
            range: getRangeFromSourceLocation(node.keyNode.loc),
          },
        ];
      }
    } else if (cursorHover?.type === "SERVICE_IMPLEMENTATION") {
      const services = cursorHover.machine
        .getAllServices(["named"])
        .filter((elem) => elem.src === cursorHover.name);

      return services.map((service) => {
        return {
          uri: params.textDocument.uri,
          range: getRangeFromSourceLocation(
            service.srcNode?.loc || service.node.loc!,
          ),
        };
      });
    }
  } catch (e) {}

  return [];
};
