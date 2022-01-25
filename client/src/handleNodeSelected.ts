import * as vscode from "vscode";
import { parseMachinesFromFile } from "xstate-parser-demo";
import { getRangeFromSourceLocation } from "xstate-vscode-shared";
import { VSCodeNodeSelectedEvent } from "./editorWebviewScript";
import { resolveUriToFilePrefix } from "./resolveUriToFilePrefix";

export const handleNodeSelected = async (event: VSCodeNodeSelectedEvent) => {
  const activeEditor = vscode.window.activeTextEditor;

  if (resolveUriToFilePrefix(activeEditor.document.uri.path) !== event.uri) {
    return;
  }
  const text = activeEditor.document.getText();

  const result = parseMachinesFromFile(text);

  const machine = result.machines[event.index];

  if (!machine) return;

  const node = machine.getStateNodeByPath(event.path);

  if (!node) return;

  const range = getRangeFromSourceLocation(node.ast.node.loc);

  vscode.window.activeTextEditor.revealRange(
    new vscode.Range(
      new vscode.Position(range.start.line, range.start.character),
      new vscode.Position(range.end.line, range.end.character),
    ),
    vscode.TextEditorRevealType.InCenter,
  );
};
