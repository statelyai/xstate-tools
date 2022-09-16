import { NotificationMap, RequestMap } from '@xstate/tools-shared';
import * as vscode from 'vscode';
import { TextDocument } from 'vscode-languageserver-textdocument';
import {
  createConnection,
  HandlerResult,
  ProposedFeatures,
  TextDocuments,
} from 'vscode-languageserver/node';

function _createTypeSafeConnection() {
  const connection = createConnection(ProposedFeatures.all);
  const documents = new TextDocuments(TextDocument);

  return {
    ...connection,
    documents,
    onRequest: <Type extends keyof RequestMap>(
      type: Type,
      handler: (
        params: RequestMap[Type]['params'],
        cancellationToken?: vscode.CancellationToken,
      ) => HandlerResult<RequestMap[Type]['result'], RequestMap[Type]['error']>,
    ) => connection.onRequest(type, handler),
    sendNotification: <Type extends keyof NotificationMap>(
      type: Type,
      data: NotificationMap[Type],
    ) => connection.sendNotification(type, data),
    listen: () => {
      documents.listen(connection);
      connection.listen();
    },
  };
}
export const createTypeSafeConnection: () => TypeSafeConnection =
  _createTypeSafeConnection;

export interface TypeSafeConnection
  extends ReturnType<typeof _createTypeSafeConnection> {}
