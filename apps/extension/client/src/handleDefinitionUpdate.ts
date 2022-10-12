import { parseMachinesFromFile } from '@xstate/machine-extractor';
import {
  getInlineImplementations,
  getNewMachineText,
  getRangeFromSourceLocation,
  resolveUriToFilePrefix,
} from '@xstate/tools-shared';
import * as vscode from 'vscode';
import { MachineConfig } from 'xstate';

export const handleDefinitionUpdate = async ({
  config,
  index,
  layoutString,
  uri,
}: {
  config: MachineConfig<any, any, any>;
  index: number;
  layoutString: string;
  uri: string;
}) => {
  const doc = vscode.workspace.textDocuments.find((doc) => {
    return resolveUriToFilePrefix(doc.uri.path) === uri;
  })!;

  const text = doc.getText();

  const result = parseMachinesFromFile(text);

  const machine = result.machines[index];

  if (!machine) return;

  const workspaceEdit = new vscode.WorkspaceEdit();

  const range = getRangeFromSourceLocation(machine.ast.definition?.node?.loc!);

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
      newConfig: config,
    }),
  );

  const layoutComment = machine.getLayoutComment()?.comment;

  if (layoutComment) {
    // replace layout comment content
    const range = getRangeFromSourceLocation(layoutComment.node.loc!);

    workspaceEdit.replace(
      doc.uri,
      new vscode.Range(
        new vscode.Position(range.start.line, range.start.character),
        new vscode.Position(range.end.line, range.end.character),
      ),
      `/** @xstate-layout ${layoutString} */`,
    );
  } else {
    // Insert layout comment
    const range = getRangeFromSourceLocation(machine.ast.callee.loc!);

    workspaceEdit.insert(
      doc.uri,
      new vscode.Position(range.start.line, range.start.character),
      `\n/** @xstate-layout ${layoutString} */\n`,
    );
  }

  await vscode.workspace.applyEdit(workspaceEdit);
};
