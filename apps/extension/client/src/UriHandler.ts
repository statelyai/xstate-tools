import * as vscode from "vscode";

class UriEventHandler
  extends vscode.EventEmitter<vscode.Uri>
  implements vscode.UriHandler
{
  public handleUri(uri: vscode.Uri): vscode.ProviderResult<void> {
    this.fire(uri);
  }
}

export const uriHandler = new UriEventHandler();
