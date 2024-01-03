import {
  forEachEntity,
  getRangeFromSourceLocation,
} from '@xstate/tools-shared';
import { TextDocumentIdentifier } from 'vscode-languageserver';
import { Position, Range } from 'vscode-languageserver-textdocument';
import { MachineConfig, createMachine } from 'xstate';
import { getCursorHoverType } from './getCursorHoverType';
import { CachedDocument } from './types';

export const getReferences = (
  {
    position,
    textDocument,
  }: {
    position: Position;
    textDocument: TextDocumentIdentifier;
  },
  { extractionResults }: CachedDocument,
): { uri: string; range: Range }[] => {
  const cursorHover = getCursorHoverType(extractionResults, position);

  try {
    if (cursorHover?.type === 'TARGET') {
      const config = cursorHover.machine.toConfig();
      if (!config) return [];

      // Actions and actors don't matter here so we stub them out
      forEachEntity(config, (entity) => {
        if (entity && 'src' in entity) {
          return { src: 'anonymous' };
        }
        return { type: 'anonymous' };
      });

      const fullMachine = createMachine(
        config as unknown as MachineConfig<any, any, any>,
      );

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
          uri: textDocument.uri,
          range: getRangeFromSourceLocation(node.ast.node.loc),
        },
      ];
    }
    if (cursorHover?.type === 'INITIAL') {
      const config = cursorHover.machine.toConfig();
      if (!config) return [];

      // Actions and actors don't matter here so we stub them out
      forEachEntity(config, (entity) => {
        if (entity && 'src' in entity) {
          return { src: 'anonymous' };
        }
        return { type: 'anonymous' };
      });

      const fullMachine = createMachine(
        config as unknown as MachineConfig<any, any, any>,
      );

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
          uri: textDocument.uri,
          range: getRangeFromSourceLocation(node.ast.node.loc),
        },
      ];
    }
    if (cursorHover?.type === 'ACTION') {
      const node = cursorHover.machine.getActionImplementation(
        cursorHover.name,
      );

      if (node?.keyNode.loc) {
        return [
          {
            uri: textDocument.uri,
            range: getRangeFromSourceLocation(node.keyNode.loc),
          },
        ];
      }
    } else if (cursorHover?.type === 'ACTION_IMPLEMENTATION') {
      const actions = cursorHover.machine
        .getAllConds(['named'])
        .filter((elem) => elem.name === cursorHover.name);

      return actions.map((action) => {
        return {
          uri: textDocument.uri,
          range: getRangeFromSourceLocation(action.node.loc!),
        };
      });
    }

    if (cursorHover?.type === 'COND') {
      const node = cursorHover.machine.getGuardImplementation(cursorHover.name);

      if (node?.keyNode.loc) {
        return [
          {
            uri: textDocument.uri,
            range: getRangeFromSourceLocation(node.keyNode.loc),
          },
        ];
      }
    } else if (cursorHover?.type === 'COND_IMPLEMENTATION') {
      const guards = cursorHover.machine
        .getAllConds(['named'])
        .filter((elem) => elem.name === cursorHover.name);

      return guards.map((guard) => {
        return {
          uri: textDocument.uri,
          range: getRangeFromSourceLocation(guard.node.loc!),
        };
      });
    }
    if (cursorHover?.type === 'SERVICE') {
      const node = cursorHover.machine.getServiceImplementation(
        cursorHover.name,
      );

      if (node?.keyNode.loc) {
        return [
          {
            uri: textDocument.uri,
            range: getRangeFromSourceLocation(node.keyNode.loc),
          },
        ];
      }
    } else if (cursorHover?.type === 'SERVICE_IMPLEMENTATION') {
      const services = cursorHover.machine
        .getAllServices(['named'])
        .filter((elem) => elem.src === cursorHover.name);

      return services.map((service) => {
        return {
          uri: textDocument.uri,
          range: getRangeFromSourceLocation(
            service.srcNode?.loc || service.node.loc!,
          ),
        };
      });
    }
  } catch (e) {}

  return [];
};
