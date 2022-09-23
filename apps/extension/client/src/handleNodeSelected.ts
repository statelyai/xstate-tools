import { parseMachinesFromFile } from '@xstate/machine-extractor';
import { getRangeFromSourceLocation } from '@xstate/tools-shared';
import * as vscode from 'vscode';
import { VSCodeNodeSelectedEvent } from './editorWebviewScript';

export const handleNodeSelected = async (event: VSCodeNodeSelectedEvent) => {
  const activeEditor = vscode.window.visibleTextEditors.find((editor) => {
    return editor.document.uri.toString() === event.uri;
  });

  if (!activeEditor) return;

  const text = activeEditor.document.getText();

  const result = parseMachinesFromFile(text);

  const machine = result.machines[event.index];

  if (!machine) return;

  const node = machine.getStateNodeByPath(event.path);

  if (!node) return;

  const range = getRangeFromSourceLocation(node.ast.node.loc!);

  activeEditor.revealRange(
    new vscode.Range(
      new vscode.Position(range.start.line, range.start.character),
      new vscode.Position(range.end.line, range.end.character),
    ),
    vscode.TextEditorRevealType.InCenter,
  );
};
