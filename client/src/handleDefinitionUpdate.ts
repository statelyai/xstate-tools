import * as prettier from "prettier";
import * as vscode from "vscode";
import { parseMachinesFromFile } from "xstate-parser-demo";
import {
  getRangeFromSourceLocation,
  getRawTextFromNode,
} from "xstate-vscode-shared";
import { UpdateDefinitionEvent } from "./editorWebviewScript";
import { resolveUriToFilePrefix } from "./resolveUriToFilePrefix";

const prettierStartRegex = /^([^{]){1,}/;
const prettierEndRegex = /([^}]){1,}$/;

const STATE_KEYS_TO_PRESERVE = [
  "context",
  "tsTypes",
  "schema",
  "meta",
  "data",
  "delimiter",
  "preserveActionOrder",
] as const;

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

  const nodesToPreserve: string[] = STATE_KEYS_TO_PRESERVE.map((nodeKey) => {
    return machine.ast.definition?.[nodeKey]?.node
      ? `\n${nodeKey}: ${getRawTextFromNode(
          text,
          machine.ast.definition?.[nodeKey]?.node,
        ).replace("\n", " ")},`
      : "";
  });

  const json = JSON.stringify(event.config, null, 2);

  const prettierConfig = await prettier.resolveConfig(doc.fileName);

  let finalTextToInput = `${json.slice(0, 1)}${nodesToPreserve.join(
    "",
  )}${json.slice(1)}`;

  try {
    const result = await prettier.format(`(${finalTextToInput})`, {
      ...prettierConfig,
      parser: "typescript",
    });

    finalTextToInput = result
      .replace(prettierStartRegex, "")
      .replace(prettierEndRegex, "");
  } catch (e) {
    console.log(e);
  }

  workspaceEdit.replace(
    doc.uri,
    new vscode.Range(
      new vscode.Position(range.start.line, range.start.character),
      new vscode.Position(range.end.line, range.end.character),
    ),
    finalTextToInput,
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
