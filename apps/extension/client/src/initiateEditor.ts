import { parseMachinesFromFile } from "@xstate/machine-extractor";
import {
  filterOutIgnoredMachines,
  getInlineImplementations,
  ImplementationsMetadata,
  isCursorInPosition,
  resolveUriToFilePrefix,
} from "@xstate/tools-shared";
import * as path from "path";
import * as vscode from "vscode";
import { MachineConfig } from "xstate";
import { getAuth, SignInResult } from "./auth";
import { getBaseUrl } from "./constants";
import { EditorWebviewScriptEvent } from "./editorWebviewScript";
import { getWebviewContent } from "./getWebviewContent";
import { handleDefinitionUpdate } from "./handleDefinitionUpdate";
import { handleNodeSelected } from "./handleNodeSelected";
import { debounce } from "./utils";

export const initiateEditor = (context: vscode.ExtensionContext) => {
  const baseUrl = getBaseUrl();

  let currentPanel: vscode.WebviewPanel | undefined = undefined;

  const sendMessage = (event: EditorWebviewScriptEvent) => {
    currentPanel?.webview.postMessage(JSON.stringify(event));
  };

  const startService = async (
    config: MachineConfig<any, any, any>,
    machineIndex: number,
    uri: string,
    layoutString: string | undefined,
    implementations: ImplementationsMetadata
  ) => {
    const result = await vscode.window.withProgress<SignInResult>(
      {
        location: vscode.ProgressLocation.Window,
        title: "Signing in via Stately...",
        cancellable: true,
      },
      (_, token) => {
        return getAuth(context).signIn(token.onCancellationRequested);
      }
    );

    if (result === "could-not-open-external-url") {
      vscode.window.showErrorMessage("Could not open an external URL");
      return;
    } else if (result === "timed-out") {
      vscode.window.showErrorMessage(
        "The authentication request timed out. Please try again."
      );
      return;
    } else if (result === "unknown-error") {
      vscode.window.showErrorMessage(
        "An unknown error occurred. Please try again."
      );
      return;
    } else if (result === "cancelled") {
      return;
    }

    if (currentPanel) {
      currentPanel.reveal(vscode.ViewColumn.Beside);

      sendMessage({
        type: "RECEIVE_SERVICE",
        config,
        index: machineIndex,
        uri: resolveUriToFilePrefix(uri),
        layoutString,
        token: result,
        implementations,
        baseUrl,
      });
    } else {
      currentPanel = vscode.window.createWebviewPanel(
        "editor",
        "XState Editor",
        vscode.ViewColumn.Beside,
        { enableScripts: true, retainContextWhenHidden: true }
      );

      const onDiskPath = vscode.Uri.file(
        path.join(context.extensionPath, "scripts", "editorWebview.js")
      );

      const src = currentPanel.webview.asWebviewUri(onDiskPath);

      currentPanel.webview.html = getWebviewContent(src, "XState Editor");

      sendMessage({
        type: "RECEIVE_SERVICE",
        config,
        index: machineIndex,
        uri: resolveUriToFilePrefix(uri),
        layoutString,
        token: result,
        implementations,
        baseUrl,
      });

      currentPanel.webview.onDidReceiveMessage(
        async (event: EditorWebviewScriptEvent) => {
          if (event.type === "vscode.updateDefinition") {
            await handleDefinitionUpdate(event);
          } else if (event.type === "vscode.selectNode") {
            await handleNodeSelected(event);
          } else if (event.type === "vscode.openLink") {
            vscode.env.openExternal(vscode.Uri.parse(event.url));
          }
        },
        undefined,
        context.subscriptions
      );

      // Handle disposing the current XState Editor
      currentPanel.onDidDispose(
        () => {
          currentPanel = undefined;
        },
        undefined,
        context.subscriptions
      );
    }
  };

  const sendChangesToVisualEditor = (document: vscode.TextDocument) => {
    const text = document.getText();
    const result = parseMachinesFromFile(text);

    if (result.machines.length > 0) {
      result.machines.forEach((machine, index) => {
        sendMessage({
          type: "RECEIVE_CONFIG_UPDATE_FROM_VSCODE",
          config: machine.toConfig({ hashInlineImplementations: true })!,
          index: index,
          uri: resolveUriToFilePrefix(document.uri.path),
          layoutString: machine.getLayoutComment()?.value || "",
          implementations: getInlineImplementations(machine, text),
        });
      });
    }
  };

  const getSendChangesSubscription = () => {
    const xstateConfig = vscode.workspace.getConfiguration("xstate");
    const sendChangesOnCreation =
      xstateConfig.get<string>("sendChanges") === "onCreation";
    const sendChangesDelay =
      xstateConfig.get<number>("sendChangesDelay") ?? 1000;

    if (sendChangesOnCreation) {
      const debouncedSendChangesToVisualEditor = debounce(
        sendChangesToVisualEditor,
        sendChangesDelay
      );

      return vscode.workspace.onDidChangeTextDocument(({ document }) =>
        debouncedSendChangesToVisualEditor(document)
      );
    } else {
      return vscode.workspace.onDidSaveTextDocument(sendChangesToVisualEditor);
    }
  };
  let sendChangesSubscription = getSendChangesSubscription();
  context.subscriptions.push(sendChangesSubscription);

  // Handle the case where the user updates the xstate settings
  vscode.workspace.onDidChangeConfiguration((event) => {
    if (
      event.affectsConfiguration("xstate.sendChanges") ||
      event.affectsConfiguration("xstate.sendChangesDelay")
    ) {
      sendChangesSubscription.dispose();
      sendChangesSubscription = getSendChangesSubscription();
    }
  });

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "stately-xstate.edit-code-lens",
      async (
        config: MachineConfig<any, any, any>,
        machineIndex: number,
        uri: string,
        layoutString?: string
      ) => {
        const activeTextEditor = vscode.window.activeTextEditor!;
        const currentText = activeTextEditor.document.getText();

        const result = filterOutIgnoredMachines(
          parseMachinesFromFile(currentText)
        );

        const machine = result.machines[machineIndex];

        const implementations = getInlineImplementations(machine, currentText);

        startService(
          config,
          machineIndex,
          resolveUriToFilePrefix(activeTextEditor.document.uri.path),
          layoutString,
          implementations
        );
      }
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("stately-xstate.edit", () => {
      try {
        const activeTextEditor = vscode.window.activeTextEditor!;
        const currentSelection = activeTextEditor.selection;
        const currentText = activeTextEditor.document.getText();

        const result = filterOutIgnoredMachines(
          parseMachinesFromFile(currentText)
        );

        let foundIndex: number | null = null;

        const machine = result.machines.find((machine, index) => {
          if (
            machine?.ast?.definition?.node?.loc ||
            machine?.ast?.options?.node?.loc
          ) {
            const isInPosition =
              isCursorInPosition(
                machine?.ast?.definition?.node?.loc!,
                currentSelection.start
              ) ||
              isCursorInPosition(
                machine?.ast?.options?.node?.loc!,
                currentSelection.start
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
            "Could not find a machine at the current cursor."
          );
          return;
        }

        const implementations = getInlineImplementations(machine, currentText);

        startService(
          machine.toConfig({ hashInlineImplementations: true })!,
          foundIndex!,
          resolveUriToFilePrefix(
            vscode.window.activeTextEditor!.document.uri.path
          ),
          machine.getLayoutComment()?.value,
          implementations
        );
      } catch (e) {
        vscode.window.showErrorMessage(
          "Could not find a machine at the current cursor."
        );
      }
    })
  );
};
