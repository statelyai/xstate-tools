import type { ExtractorDigraphDef } from '@xstate/ts-project';
import * as vscode from 'vscode';
import { ActorRef, ExtractEvent, Snapshot, fromCallback } from 'xstate';
import { LanguageClientEvent, OpenMachineData } from './languageClient';

// this should not be an async function, it should return `webviewPanel` synchronously
// to allow the consumer to start listening to events from the webview immediately
function createWebviewPanel() {
  const viewColumn = vscode.workspace
    .getConfiguration('xstate')
    .get('viewColumn');
  // TODO: this should have more strict CSP rules
  return vscode.window.createWebviewPanel(
    'editor',
    'XState Editor',
    viewColumn === 'active'
      ? vscode.ViewColumn.Active
      : vscode.ViewColumn.Beside,
    {
      enableScripts: true,
      retainContextWhenHidden: true,
    },
  );
}

async function getWebviewHtml(
  extensionContext: vscode.ExtensionContext,
  webviewPanel: vscode.WebviewPanel,
  params: {
    digraph: ExtractorDigraphDef;
  } & OpenMachineData,
) {
  const bundledEditorRootUri = vscode.Uri.joinPath(
    vscode.Uri.file(extensionContext.extensionPath),
    'bundled-editor',
  );
  const htmlContent = new TextDecoder().decode(
    await vscode.workspace.fs.readFile(
      vscode.Uri.joinPath(bundledEditorRootUri, 'index.html'),
    ),
  );
  const baseTag = `<base href="${webviewPanel.webview.asWebviewUri(
    bundledEditorRootUri,
  )}/">`;

  // TODO: atm this is not refreshed with the theme changes
  const theme =
    vscode.workspace.getConfiguration('xstate').get('theme') ?? 'dark';

  const initialDataScript = `<script>window.__vscodeInitParams = ${JSON.stringify(
    {
      themeKind:
        theme === 'auto'
          ? vscode.window.activeColorTheme.kind === vscode.ColorThemeKind.Dark
            ? 'dark'
            : 'light'
          : theme,
      distinctId: `vscode:${vscode.env.machineId}`,
      ...params,
    },
  )}</script>`;

  return htmlContent.replace('<head>', `<head>${baseTag}${initialDataScript}`);
}

export const webviewLogic = fromCallback<
  ExtractEvent<LanguageClientEvent, 'OPEN_MACHINE'>,
  {
    extensionContext: vscode.ExtensionContext;
    parent: ActorRef<Snapshot<unknown>, LanguageClientEvent>;
    digraph: ExtractorDigraphDef;
  } & OpenMachineData
>(({ input: { extensionContext, parent, ...initialParams }, receive }) => {
  let canceled = false;
  const webviewPanel = createWebviewPanel();

  receive((event) => {
    switch (event.type) {
      case 'OPEN_MACHINE':
        webviewPanel.reveal(vscode.ViewColumn.Beside);
        webviewPanel.webview.postMessage(event);
        return;
      default:
        event.type satisfies never;
    }
  });

  const disposable = vscode.Disposable.from(
    webviewPanel.webview.onDidReceiveMessage(
      (event: ExtractEvent<LanguageClientEvent, 'APPLY_PATCHES'>) => {
        parent.send(event);
      },
    ),
    webviewPanel.onDidDispose(() => {
      parent.send({ type: 'WEBVIEW_CLOSED' });
    }),
  );

  (async () => {
    const html = await getWebviewHtml(
      extensionContext,
      webviewPanel,
      initialParams,
    );
    if (canceled) {
      return;
    }
    webviewPanel.webview.html = html;
  })();

  return () => {
    canceled = true;
    disposable.dispose();
  };
});
