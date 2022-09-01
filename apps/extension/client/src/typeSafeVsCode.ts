import * as vscode from 'vscode';
import { MachineConfig } from 'xstate';

export interface XStateCommands {
  // those are related to the editor
  'stately-xstate.edit': [];
  'stately-xstate.edit-code-lens': [
    config: MachineConfig<any, any, any>,
    machineIndex: number,
    uri: string,
    layoutString?: string,
  ];
  // those are related to the visualizer
  'stately-xstate.visualize': [];
  'stately-xstate.inspect': [
    config: MachineConfig<any, any, any>,
    machineIndex: number,
    uri: string,
    guardsToMock: string[],
  ];
}

export function registerCommand<Name extends keyof XStateCommands>(
  name: Name,
  handler: (...args: XStateCommands[Name]) => void,
) {
  return vscode.commands.registerCommand(name, handler);
}

interface XStateConfiguration {
  theme?: 'auto' | 'dark' | 'light';
}

export function getConfiguration<Name extends keyof XStateConfiguration>(
  name: Name,
): XStateConfiguration[Name] {
  return vscode.workspace.getConfiguration('xstate').get(name);
}
