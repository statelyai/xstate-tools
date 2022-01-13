import * as vscode from "vscode";
import { parseMachinesFromFile } from "xstate-parser-demo";
import {
  getRangeFromSourceLocation,
  getRawTextFromNode,
} from "xstate-vscode-shared";
import { UpdateDefinitionEvent } from "./editorWebviewScript";
import { resolveUriToFilePrefix } from "./resolveUriToFilePrefix";

export const handleDefinitionUpdate = async (event: UpdateDefinitionEvent) => {
  const doc = vscode.workspace.textDocuments.find((doc) => {
    return resolveUriToFilePrefix(doc.uri.path) === event.uri;
  });

  const text = doc.getText();

  const result = parseMachinesFromFile(text);

  const machine = result.machines[event.index];

  if (!machine) return;

  const layoutComment = machine.getLayoutComment()?.comment;

  const workspaceEdit = new vscode.WorkspaceEdit();

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
      new vscode.Position(range.start.line - 1, 0),
      `\n/** @xstate-layout ${event.layoutString} */`,
    );
  }

  const range = getRangeFromSourceLocation(machine.ast.definition?.node?.loc);

  /**
   * Grabs the context as a raw string from the machine definition
   */
  const contextRaw = machine.ast.definition?.context?.node
    ? `\ncontext: ${getRawTextFromNode(
        text,
        machine.ast.definition?.context?.node,
      ).replace("\n", " ")},`
    : "";

  const json = JSON.stringify(event.config, null, 2);

  /**
   * Adds the context to the JSON (pretty ugly but works)
   */
  const jsonWithContext = `${json.slice(0, 1)}${contextRaw}${json.slice(1)}`;

  workspaceEdit.replace(
    doc.uri,
    new vscode.Range(
      new vscode.Position(range.start.line, range.start.character),
      new vscode.Position(range.end.line, range.end.character),
    ),
    jsonWithContext,
  );

  await vscode.workspace.applyEdit(workspaceEdit);
};
