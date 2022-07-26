import * as vscode from "vscode";

export const getBaseUrl = (): string =>
  vscode.workspace.getConfiguration().get("xstate.targetEditorBaseUrl")!;
export const getTokenKey = () => {
  const baseUrl = getBaseUrl();
  return `stately-editor-key#${baseUrl}`;
};

export const EXTENSION_ID = "statelyai.stately-vscode";
