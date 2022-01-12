import * as path from "path";
import * as vscode from "vscode";
import { MachineConfig } from "xstate";
import { parseMachinesFromFile } from "xstate-parser-demo";
import {
  filterOutIgnoredMachines,
  getInlineImplementations,
  isCursorInPosition,
} from "xstate-vscode-shared";
import { EditorWebviewScriptEvent } from "./editorWebviewScript";
import { getWebviewContent } from "./getWebviewContent";
import { handleDefinitionUpdate } from "./handleDefinitionUpdate";
import { resolveUriToFilePrefix } from "./resolveUriToFilePrefix";

export const initiateEditor = (context: vscode.ExtensionContext) => {
  let currentPanel: vscode.WebviewPanel | undefined = undefined;

  const sendMessage = (event: EditorWebviewScriptEvent) => {
    currentPanel?.webview.postMessage(JSON.stringify(event));
  };

  const startService = (
    config: MachineConfig<any, any, any>,
    machineIndex: number,
    uri: string,
    layoutString: string | undefined,
  ) => {
    if (currentPanel) {
      currentPanel.reveal(vscode.ViewColumn.Beside);

      sendMessage({
        type: "RECEIVE_SERVICE",
        config,
        index: machineIndex,
        uri,
        layoutString,
      });
    } else {
      currentPanel = vscode.window.createWebviewPanel(
        "editor",
        "XState Editor",
        vscode.ViewColumn.Beside,
        { enableScripts: true, retainContextWhenHidden: true },
      );

      const onDiskPath = vscode.Uri.file(
        path.join(
          context.extensionPath,
          "client",
          "scripts",
          "editorWebview.js",
        ),
      );

      const src = currentPanel.webview.asWebviewUri(onDiskPath);

      currentPanel.webview.html = getWebviewContent(src, "XState Editor");

      sendMessage({
        type: "RECEIVE_SERVICE",
        config,
        index: machineIndex,
        uri,
        layoutString,
      });

      currentPanel.webview.onDidReceiveMessage(
        async (event: EditorWebviewScriptEvent) => {
          if (event.type === "UPDATE_DEFINITION") {
            await handleDefinitionUpdate(event);
          }
        },
        undefined,
        context.subscriptions,
      );

      // Handle disposing the current XState Editor
      currentPanel.onDidDispose(
        () => {
          currentPanel = undefined;
        },
        undefined,
        context.subscriptions,
      );
    }
  };

  context.subscriptions.push(
    vscode.commands.registerCommand("xstate.edit", () => {
      try {
        const currentSelection = vscode.window.activeTextEditor.selection;

        const currentText = vscode.window.activeTextEditor.document.getText();

        const result = filterOutIgnoredMachines(
          parseMachinesFromFile(currentText),
        );

        let foundIndex: number | null = null;

        const machine = result.machines.find((machine, index) => {
          if (
            machine?.ast?.definition?.node?.loc ||
            machine?.ast?.options?.node?.loc
          ) {
            const isInPosition =
              isCursorInPosition(
                machine?.ast?.definition?.node?.loc,
                currentSelection.start,
              ) ||
              isCursorInPosition(
                machine?.ast?.options?.node?.loc,
                currentSelection.start,
              );

            if (isInPosition) {
              foundIndex = index;
              return true;
            }
          }
          return false;
        });
        if (!machine) {
          vscode.window.showErrorMessage(
            "Could not find a machine at the current cursor.",
          );
          return;
        }

        const hasInlineImplementations =
          getInlineImplementations(machine).length > 0;

        if (hasInlineImplementations) {
          vscode.window.showErrorMessage(
            "Machines containing inline implementations cannot be edited visually.",
          );
          return;
        }

        startService(
          machine.toConfig() as any,
          foundIndex!,
          resolveUriToFilePrefix(
            vscode.window.activeTextEditor.document.uri.path,
          ),
          machine.getLayoutComment()?.value,
        );
      } catch (e) {
        vscode.window.showErrorMessage(
          "Could not find a machine at the current cursor.",
        );
      }
    }),
  );
};
