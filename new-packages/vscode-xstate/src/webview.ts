import type { ExtractorDigraphDef } from '@xstate/ts-project';
import * as vscode from 'vscode';
import { ActorRef, Snapshot, fromCallback } from 'xstate';
import { LanguageClientEvent } from './languageClient';

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
  {
    digraph,
  }: {
    digraph: ExtractorDigraphDef;
  },
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
      digraph,
    },
  )}</script>`;

  return htmlContent.replace('<head>', `<head>${baseTag}${initialDataScript}`);
}

export const webviewLogic = fromCallback<
  { type: 'UPDATE_DIGRAPH'; digraph: ExtractorDigraphDef },
  {
    extensionContext: vscode.ExtensionContext;
    parent: ActorRef<Snapshot<unknown>, LanguageClientEvent>;
    digraph: ExtractorDigraphDef;
  }
>(({ input: { extensionContext, parent, digraph }, receive }) => {
  let canceled = false;
  const webviewPanel = createWebviewPanel();

  receive((event) => {
    switch (event.type) {
      case 'UPDATE_DIGRAPH':
        webviewPanel.reveal(vscode.ViewColumn.Beside);
        webviewPanel.webview.postMessage({
          type: 'UPDATE_DIGRAPH',
          digraph: event.digraph,
        });
        return;
      default:
        event.type satisfies never;
    }
  });

  const disposable = vscode.Disposable.from(
    webviewPanel.webview.onDidReceiveMessage((event: LanguageClientEvent) =>
      parent.send(event),
    ),
    webviewPanel.onDidDispose(() => {
      parent.send({ type: 'WEBVIEW_CLOSED' });
    }),
  );

  (async () => {
    const html = await getWebviewHtml(extensionContext, webviewPanel, {
      digraph,
    });
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
