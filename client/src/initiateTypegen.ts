import * as vscode from "vscode";
import * as path from "path";
import { LanguageClient } from "vscode-languageclient/node";
import { interpret } from "xstate";
import { parseMachinesFromFile } from "xstate-parser-demo";
import { XStateUpdateEvent } from "xstate-vscode-shared";
import { typeArgumentLogicMachine } from "./typeArgumentLogicMachine";
import { startTypegenService } from "./typegenService";

export const initiateTypegen = (
  context: vscode.ExtensionContext,
  client: LanguageClient,
) => {
  const typegenService = startTypegenService();

  // Stops the typegen service
  context.subscriptions.push({
    dispose: () => {
      typegenService.stop();
    },
  });

  context.subscriptions.push(
    vscode.workspace.onWillSaveTextDocument(async (event) => {
      const text = event.document.getText();
      const result = parseMachinesFromFile(text);

      if (result.machines.length > 0) {
        event.waitUntil(
          new Promise((resolve) => {
            const fileEdits: vscode.TextEdit[] = [];

            const relativePath = removeExtension(
              path.basename(event.document.uri.path),
            );

            let machineIndex = 0;

            result.machines.forEach((machine, index) => {
              const service = interpret(
                typeArgumentLogicMachine(
                  machine,
                  (textEdit) => fileEdits.push(textEdit),
                  (start, end) => text.slice(start, end),
                  relativePath,
                  machineIndex,
                ),
              ).start();
              service.stop();

              if (machine.ast?.definition?.tsTypes?.value) {
                machineIndex++;
              }
            });

            resolve(fileEdits);
          }),
        );
      }
    }),
  );

  client.onReady().then(() => {
    context.subscriptions.push(
      client.onNotification("xstate/update", (event: XStateUpdateEvent) => {
        if (event.machines.length === 0) return;
        typegenService.send({
          type: "RECEIVE_NEW_EVENT",
          event,
        });
      }),
    );
  });
};

const removeExtension = (input: string) => {
  return input.substr(0, input.lastIndexOf("."));
};
