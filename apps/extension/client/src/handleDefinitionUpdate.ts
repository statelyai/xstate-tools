import * as vscode from "vscode";
import { parseMachinesFromFile } from "@xstate/machine-extractor";
import {
  getInlineImplementations,
  getNewMachineText,
  getRangeFromSourceLocation,
  resolveUriToFilePrefix,
} from "@xstate/tools-shared";
import { UpdateDefinitionEvent } from "./editorWebviewScript";

export const handleDefinitionUpdate = async (event: UpdateDefinitionEvent) => {
  const doc = vscode.workspace.textDocuments.find((doc) => {
    return resolveUriToFilePrefix(doc.uri.path) === event.uri;
  });

  const text = doc.getText();

  const result = parseMachinesFromFile(text);

  const machine = result.machines[event.index];

  if (!machine) return;

  const workspaceEdit = new vscode.WorkspaceEdit();

  const range = getRangeFromSourceLocation(machine.ast.definition?.node?.loc);

  workspaceEdit.replace(
    doc.uri,
    new vscode.Range(
      new vscode.Position(range.start.line, range.start.character),
      new vscode.Position(range.end.line, range.end.character),
    ),
    await getNewMachineText({
      fileName: doc.fileName,
      machine,
      implementations: getInlineImplementations(machine, text),
      text,
      newConfig: event.config,
    }),
  );

  const layoutComment = machine.getLayoutComment()?.comment;

  if (layoutComment) {
    // replace layout comment content
    const range = getRangeFromSourceLocation(layoutComment.node.loc);

    workspaceEdit.replace(
      doc.uri,
      new vscode.Range(
        new vscode.Position(range.start.line, range.start.character),
        new vscode.Position(range.end.line, range.end.character),
      ),
      `/** @xstate-layout ${event.layoutString} */`,
    );
  } else {
    // Insert layout comment
    const range = getRangeFromSourceLocation(machine.ast.callee.loc);

    workspaceEdit.insert(
      doc.uri,
      new vscode.Position(range.start.line, range.start.character),
      `\n/** @xstate-layout ${event.layoutString} */\n`,
    );
  }

  await vscode.workspace.applyEdit(workspaceEdit);
};
