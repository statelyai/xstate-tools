import { writeToTypegenFile } from '@xstate/tools-shared';
import * as os from 'os';
import * as vscode from 'vscode';
import { TypeSafeLanguageClient } from './typeSafeLanguageClient';

export const initiateTypegen = (
  context: vscode.ExtensionContext,
  languageClient: TypeSafeLanguageClient,
) => {
  context.subscriptions.push(
    vscode.workspace.onWillSaveTextDocument((event) => {
      event.waitUntil(
        languageClient
          .sendRequest('getTsTypesEdits', { uri: String(event.document.uri) })
          .then((edits) =>
            edits.map(
              (edit) =>
                new vscode.TextEdit(
                  new vscode.Range(
                    new vscode.Position(
                      edit.range[0].line,
                      edit.range[0].column,
                    ),
                    new vscode.Position(
                      edit.range[1].line,
                      edit.range[1].column,
                    ),
                  ),
                  edit.newText,
                ),
            ),
          ),
      );
    }),
  );

  context.subscriptions.push(
    languageClient.onNotification('typesUpdated', ({ uri, types }) => {
      // TODO: figure out a way to decouple ourselves from the file system and the OS
      const pathFromUri = vscode.Uri.parse(uri, true).path;

      writeToTypegenFile(
        os.platform() === 'win32' ? pathFromUri.slice(1) : pathFromUri,
        types,
      ).catch(() => {});
    }),
  );
};
