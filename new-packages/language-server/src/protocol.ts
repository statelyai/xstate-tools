import * as vscode from 'vscode-languageserver-protocol';

export const helloRequest = new vscode.RequestType<
  {
    textDocument?: vscode.TextDocumentIdentifier | undefined;
    name: string;
  },
  boolean,
  never
>('xstate/hello');
