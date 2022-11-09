/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import * as path from 'path';
import * as vscode from 'vscode';
import { handleTypegenNestingConfig } from './checkTypegenNesting';
import { initiateEditor } from './initiateEditor';
import { initiateTypegen } from './initiateTypegen';
import { initiateVisualizer } from './initiateVisualizer';
import { TypeSafeLanguageClient } from './typeSafeLanguageClient';

let languageClient: TypeSafeLanguageClient | undefined;

export async function activate(context: vscode.ExtensionContext) {
  const serverModule = context.asAbsolutePath(path.join('dist', 'server.js'));

  languageClient = new TypeSafeLanguageClient(serverModule);
  languageClient.start();
  await languageClient.onReady();

  handleTypegenNestingConfig();
  initiateVisualizer(context, languageClient);
  initiateEditor(context, languageClient);
  initiateTypegen(context, languageClient);
}

export function deactivate(): Thenable<void> | undefined {
  return languageClient?.stop();
}
