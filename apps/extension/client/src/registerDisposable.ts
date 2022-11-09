import * as vscode from 'vscode';

function removeFromMutableArray<T>(array: T[], item: T) {
  const index = array.indexOf(item);
  if (index !== -1) {
    array.splice(index, 1);
  }
}

export function registerDisposable(
  extensionContext: vscode.ExtensionContext,
  disposable: vscode.Disposable,
) {
  extensionContext.subscriptions.push(disposable);
  return () => {
    removeFromMutableArray(extensionContext.subscriptions, disposable);
    disposable.dispose();
  };
}
