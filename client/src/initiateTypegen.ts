import * as path from "path";
import * as vscode from "vscode";
import { LanguageClient } from "vscode-languageclient/node";
import { parseMachinesFromFile } from "xstate-parser-demo";
import {
  getRangeFromSourceLocation,
  getRawTextFromNode,
  XStateUpdateEvent,
} from "xstate-vscode-shared";
import { startTypegenService } from "./typegenService";

export const initiateTypegen = (
  context: vscode.ExtensionContext,
  client: LanguageClient,
  registerXStateUpdateListener: (
    listener: (event: XStateUpdateEvent) => void,
  ) => vscode.Disposable,
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
              if (machine.ast?.definition?.tsTypes) {
                const currentText = getRawTextFromNode(
                  text,
                  machine.ast.definition.tsTypes.node,
                );

                const requiresUpdate =
                  !currentText.includes(`./${relativePath}.typegen`) ||
                  !currentText.includes(`Typegen${machineIndex}`);

                if (requiresUpdate) {
                  const position = getRangeFromSourceLocation(
                    machine.ast.definition.tsTypes?.node?.loc,
                  );

                  fileEdits.push(
                    new vscode.TextEdit(
                      new vscode.Range(
                        new vscode.Position(
                          position.start.line,
                          position.start.character,
                        ),
                        new vscode.Position(
                          position.end.line,
                          position.end.character,
                        ),
                      ),
                      `{} as import("./${relativePath}.typegen").Typegen${machineIndex}`,
                    ),
                  );
                }

                machineIndex++;
              }
            });
            resolve(fileEdits);
          }),
        );
      }
    }),
  );

  context.subscriptions.push(
    registerXStateUpdateListener((event) => {
      if (event.machines.length === 0) return;
      typegenService.send({
        type: "RECEIVE_NEW_EVENT",
        event,
      });
    }),
  );
};

const removeExtension = (input: string) => {
  return input.substr(0, input.lastIndexOf("."));
};
