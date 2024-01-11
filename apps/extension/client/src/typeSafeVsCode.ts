import * as vscode from 'vscode';

export interface XStateCommands {
  'stately-xstate.edit': [];
  'stately-xstate.edit-code-lens': [uri: string, machineIndex: number];
}

export function registerCommand<Name extends keyof XStateCommands>(
  name: Name,
  handler: (...args: XStateCommands[Name]) => void,
) {
  return vscode.commands.registerCommand(name, handler);
}

interface XStateConfiguration {
  theme?: 'auto' | 'dark' | 'light';
  viewColumn?: 'beside' | 'active';
}

export function getConfiguration<Name extends keyof XStateConfiguration>(
  name: Name,
): XStateConfiguration[Name] | undefined {
  return vscode.workspace.getConfiguration('xstate').get(name);
}

export function getViewColumn(): vscode.ViewColumn {
  return getConfiguration('viewColumn') === 'active'
    ? vscode.ViewColumn.Active
    : vscode.ViewColumn.Beside;
}
