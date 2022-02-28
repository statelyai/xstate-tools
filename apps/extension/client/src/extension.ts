/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import * as path from "path";
import * as vscode from "vscode";
import {
  LanguageClient,
  LanguageClientOptions,
  ServerOptions,
  TransportKind,
} from "vscode-languageclient/node";
import { XStateUpdateEvent } from "@xstate/tools-shared";
import { uniqueId } from "xstate/lib/utils";
import { getAuth, SignInResult } from "./auth";
import { initiateEditor } from "./initiateEditor";
import { initiateTypegen } from "./initiateTypegen";
import { initiateVisualizer } from "./initiateVisualizer";
import { uriHandler } from "./UriHandler";

let client: LanguageClient;

export async function activate(context: vscode.ExtensionContext) {
  // The server is implemented in node
  let serverModule = context.asAbsolutePath(path.join("dist", "server.js"));
  // The debug options for the server
  // --inspect=6009: runs the server in Node's Inspector mode so VS Code can attach to the server for debugging
  let debugOptions = { execArgv: ["--nolazy", "--inspect=6009"] };

  // If the extension is launched in debug mode then the debug server options are used
  // Otherwise the run options are used
  let serverOptions: ServerOptions = {
    run: {
      module: serverModule,
      transport: TransportKind.ipc,
    },
    debug: {
      module: serverModule,
      transport: TransportKind.ipc,
      options: debugOptions,
    },
  };

  // Options to control the language client
  let clientOptions: LanguageClientOptions = {
    documentSelector: [
      { scheme: "file", language: "typescript" },
      {
        scheme: "file",
        language: "javascript",
      },
      { scheme: "file", language: "typescriptreact" },
      {
        scheme: "file",
        language: "javascriptreact",
      },
    ],
  };

  // Create the language client and start the client.
  client = new LanguageClient(
    "xstateLanguageServer",
    "XState",
    serverOptions,
    clientOptions,
  );

  client.start();

  await client.onReady();

  const xstateUpdateListeners: Record<
    string,
    (event: XStateUpdateEvent) => void
  > = {};

  const addXStateUpdateListener = (
    listener: (event: XStateUpdateEvent) => void,
  ): vscode.Disposable => {
    const id = uniqueId();
    xstateUpdateListeners[id] = listener;
    return {
      dispose: () => {
        delete xstateUpdateListeners[id];
      },
    };
  };

  context.subscriptions.push(
    client.onNotification("xstate/update", (event: XStateUpdateEvent) => {
      Object.values(xstateUpdateListeners).forEach((listener) => {
        listener(event);
      });
    }),
  );

  initiateVisualizer(context, client, addXStateUpdateListener);
  initiateEditor(context, client);
  initiateTypegen(context, client, addXStateUpdateListener);

  context.subscriptions.push(
    vscode.window.registerUriHandler(uriHandler),
    vscode.commands.registerCommand("stately-xstate.sign-out", async () => {
      await getAuth(context).signOut();

      vscode.window.showInformationMessage("Signed out successfully.");
    }),
  );
  context.subscriptions.push(
    vscode.commands.registerCommand("stately-xstate.sign-in", async () => {
      const result = await vscode.window.withProgress<SignInResult>(
        {
          location: vscode.ProgressLocation.Notification,
          title: "Signing in via Stately...",
          cancellable: true,
        },
        (_, token) => {
          return getAuth(context).signIn(token.onCancellationRequested);
        },
      );

      if (result === "could-not-open-external-url") {
        vscode.window.showErrorMessage("Could not open an external URL");
        return;
      } else if (result === "timed-out") {
        vscode.window.showErrorMessage(
          "The authentication request timed out. Please try again.",
        );
        return;
      } else if (result === "unknown-error") {
        vscode.window.showErrorMessage(
          "An unknown error occurred. Please try again.",
        );
        return;
      } else if (result === "cancelled") {
        return;
      } else {
        vscode.window.showInformationMessage("Signed in successfully.");
      }
    }),
  );
}

export function deactivate(): Thenable<void> | undefined {
  if (!client) {
    return undefined;
  }
  return client.stop();
}
