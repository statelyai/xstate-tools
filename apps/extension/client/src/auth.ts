import * as vscode from "vscode";
import { EXTENSION_ID, getBaseUrl, getTokenKey } from "./constants";
import { uriHandler } from "./UriHandler";

export interface TokenInfo {
  token: string;
  expiresAt: number;
  providerToken: string;
  refreshToken: string;
}

export type SignInResult =
  | TokenInfo
  | "timed-out"
  | "unknown-error"
  | "could-not-open-external-url"
  | "cancelled";

export const getAuth = (context: vscode.ExtensionContext) => {
  /**
   * Grabs the login token from localStorage
   */
  const getLoginToken = async (): Promise<TokenInfo | undefined> => {
    const str = await context.secrets.get(getTokenKey());

    try {
      if (str) {
        return JSON.parse(str);
      }
    } catch (e) {
      // Fail silently if JSON.parse doesn't work
    }
  };

  /**
   * Sets the login token to secret storage
   */
  const setLoginToken = async (token: TokenInfo): Promise<void> => {
    await context.secrets.store(getTokenKey(), JSON.stringify(token));
  };

  /**
   * Deletes the login token
   */
  const deleteLoginToken = async (): Promise<void> => {
    await context.secrets.delete(getTokenKey());
  };

  /**
   * Calculates if a token has expired or not
   */
  const hasTokenExpired = (token: TokenInfo): boolean => {
    return token.expiresAt < Date.now() / 1000;
  };

  /**
   * Gets the URL we need to visit in order to grab
   * our auth token
   */
  const getLoginUrl = (redirectUrl: vscode.Uri): vscode.Uri => {
    return vscode.Uri.parse(
      `${getBaseUrl()}/registry/external-sign-in?redirectUrl=${encodeURIComponent(
        redirectUrl.toString()
      )}`
    );
  };

  /**
   * Gets the redirect URL to VSCode
   */
  const getVSCodeRedirectUrl = async (): Promise<vscode.Uri> => {
    return await vscode.env.asExternalUri(
      vscode.Uri.parse(
        `${vscode.env.uriScheme}://${EXTENSION_ID}/authenticate?response_mode=query`
      )
    );
  };

  /**
   * Waits for a result on the URI
   */
  const handleAuthCallback = async (
    onCancel: (func: () => void) => void
  ): Promise<TokenInfo | "timed-out" | "unknown-error" | "cancelled"> => {
    let uriEventListener: vscode.Disposable;

    return Promise.race<
      TokenInfo | "timed-out" | "unknown-error" | "cancelled"
    >([
      delay(30000).then(() => "timed-out"),
      new Promise((resolve) => {
        onCancel(() => {
          resolve("cancelled");
        });
      }),
      new Promise<TokenInfo | "unknown-error">((resolve) => {
        uriEventListener = uriHandler.event((uri) => {
          try {
            const result = parseQuery(uri);
            resolve({
              token: result.authToken,
              expiresAt: Number(result.expiresAt),
              providerToken: result.providerToken,
              refreshToken: result.refreshToken,
            });
          } catch (e) {
            resolve("unknown-error");
          }
        });
      })
        .then((result) => {
          uriEventListener.dispose();
          return result;
        })
        .catch((e) => {
          uriEventListener.dispose();
          console.log(e);
          return "unknown-error";
        }),
    ]);
  };

  const signIn = async (
    onCancel: (func: () => void) => void
  ): Promise<SignInResult> => {
    let token = await getLoginToken();

    if (token && !hasTokenExpired(token)) {
      return token;
    }

    await deleteLoginToken();

    const vsCodeRedirectUrl = await getVSCodeRedirectUrl();

    const externalLoginUrl = getLoginUrl(vsCodeRedirectUrl);

    const opened = await vscode.env.openExternal(externalLoginUrl);

    if (!opened) {
      return "could-not-open-external-url";
    }

    const result = await handleAuthCallback(onCancel);

    if (typeof result !== "string") {
      await setLoginToken(result);
    }

    return result;
  };

  const signOut = async () => {
    return deleteLoginToken();
  };

  return {
    signIn,
    signOut,
  };
};

async function delay(ms: number): Promise<void> {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

function parseQuery(uri: vscode.Uri): any {
  return uri.query.split("&").reduce((prev: any, current) => {
    const queryString = current.split("=");
    prev[queryString[0]] = queryString[1];
    return prev;
  }, {});
}
