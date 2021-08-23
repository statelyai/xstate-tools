/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import * as path from "path";
import { TextEncoder } from "util";
import * as vscode from "vscode";

import {
  LanguageClient,
  LanguageClientOptions,
  ServerOptions,
  TransportKind,
} from "vscode-languageclient/node";
import {
  IntrospectMachineResult,
  makeInterfaceFromIntrospectionResult,
} from "xstate-vscode-shared";

let client: LanguageClient;

export function activate(context: vscode.ExtensionContext) {
  // The server is implemented in node
  let serverModule = context.asAbsolutePath(
    path.join("server", "dist", "index.js"),
  );
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
    "XState (Demo)",
    serverOptions,
    clientOptions,
  );

  client.start();

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "xstate.create-typed-options",
      async (introspectionResult: IntrospectMachineResult, uri: string) => {
        const content = makeInterfaceFromIntrospectionResult(
          introspectionResult,
          // Remove all newlines
        ).replace(/\r?\n|\r/g, "");

        const newUri = await vscode.window.showSaveDialog({
          defaultUri: vscode.Uri.file(
            uri.replace(/\.([j,t])sx?$/, ".types.ts"),
          ),
          title: "Save type definitions",
        });

        await vscode.workspace.fs.writeFile(
          newUri,
          new TextEncoder().encode(content),
        );
        await vscode.window.showTextDocument(newUri);
      },
    ),
  );
}

export function deactivate(): Thenable<void> | undefined {
  if (!client) {
    return undefined;
  }
  return client.stop();
}
