import { NotificationMap, RequestMap } from '@xstate/tools-shared';
import * as vscode from 'vscode';
import { LanguageClient, TransportKind } from 'vscode-languageclient/node';

export class TypeSafeLanguageClient extends LanguageClient {
  constructor(serverModule: string) {
    super(
      'xstateLanguageServer',
      'XState',
      {
        run: {
          module: serverModule,
          transport: TransportKind.ipc,
        },
        debug: {
          module: serverModule,
          transport: TransportKind.ipc,
          options: { execArgv: ['--nolazy', '--inspect=6009'] },
        },
      },
      {
        documentSelector: [
          { scheme: 'file', language: 'typescript' },
          {
            scheme: 'file',
            language: 'javascript',
          },
          { scheme: 'file', language: 'typescriptreact' },
          {
            scheme: 'file',
            language: 'javascriptreact',
          },
        ],
      },
    );
  }

  sendRequest<Type extends keyof RequestMap>(
    type: Type,
    params: RequestMap[Type]['params'],
    // it would be nice to make this required on our side but TS complains that it wouldn't be compatible with the base class
    // however, simple cases allow making parameters required in derived methods so maybe this is a bug in TS when comparing complex generic signatures or something
    cancellationToken?: vscode.CancellationToken,
  ): Promise<RequestMap[Type]['result']> {
    return super.sendRequest(type, params, cancellationToken);
  }

  onNotification<Type extends keyof NotificationMap>(
    type: Type,
    callback: (data: NotificationMap[Type]) => void,
  ) {
    return super.onNotification(type, callback);
  }
}
