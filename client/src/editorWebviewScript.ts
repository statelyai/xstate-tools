import { assign } from "xstate";
import { MachineConfig } from "xstate";
import { interpret } from "xstate";
import { createMachine } from "xstate";
import { compressToEncodedURIComponent } from "lz-string";
import { TokenInfo } from "./auth";
import { BASE_URL } from "./constants";
import { ImplementationsMetadata } from "xstate-vscode-shared";

declare global {
  function acquireVsCodeApi(): {
    postMessage: (event: EditorWebviewScriptEvent) => void;
  };
}

export interface WebViewMachineContext {
  config: MachineConfig<any, any, any>;
  uri: string;
  index: number;
  layoutString: string | undefined;
  token: TokenInfo | undefined;
  implementations: ImplementationsMetadata;
}

export type EditorWebviewScriptEvent =
  | {
      type: "RECEIVE_SERVICE";
      config: MachineConfig<any, any, any>;
      layoutString: string | undefined;
      uri: string;
      index: number;
      token: TokenInfo;
      implementations: ImplementationsMetadata;
    }
  | {
      type: "NODE_SELECTED";
      path: string[];
    }
  | VSCodeNodeSelectedEvent
  | {
      type: "RECEIVE_CONFIG_UPDATE_FROM_VSCODE";
      config: MachineConfig<any, any, any>;
      uri: string;
      index: number;
      layoutString: string;
      implementations: ImplementationsMetadata;
    }
  | {
      type: "DEFINITION_UPDATED";
      layoutString: string;
      config: MachineConfig<any, any, any>;
      implementations: ImplementationsMetadata;
    }
  | UpdateDefinitionEvent;

export type VSCodeNodeSelectedEvent = {
  type: "vscode.selectNode";
  path: string[];
  uri: string;
  index: number;
};

export type UpdateDefinitionEvent = {
  type: "vscode.updateDefinition";
  config: MachineConfig<any, any, any>;
  layoutString: string;
  uri: string;
  index: number;
  implementations: ImplementationsMetadata;
};

let vscodeApi: ReturnType<typeof acquireVsCodeApi>;

const getVsCodeApi = () => {
  if (!vscodeApi) {
    vscodeApi = acquireVsCodeApi();
  }

  return vscodeApi;
};

const machine = createMachine<WebViewMachineContext, EditorWebviewScriptEvent>(
  {
    initial: "waitingForFirstContact",
    context: {
      config: {},
      uri: "",
      index: 0,
      layoutString: undefined,
      token: undefined,
      implementations: {
        implementations: {
          actions: {},
          guards: {},
          services: {},
        },
      },
    },
    invoke: {
      src: () => (send) => {
        const listener = (event) => {
          try {
            const ourEvent: EditorWebviewScriptEvent = JSON.parse(event.data);


            send(ourEvent);
          } catch (e) {
            console.warn(e);
          }
        };
        window.addEventListener("message", listener);

        return () => window.removeEventListener("message", listener);
      },
    },
    on: {
      NODE_SELECTED: {
        actions: (context, event) => {
          getVsCodeApi().postMessage({
            type: "vscode.selectNode",
            index: context.index,
            uri: context.uri,
            path: event.path,
          });
        },
      },
    },

    states: {
      waitingForFirstContact: {
        on: {
          RECEIVE_SERVICE: {
            target: "hasService",
            actions: assign((_context, event) => {
              return {
                config: event.config,
                index: event.index,
                uri: event.uri,
                layoutString: event.layoutString,
                token: event.token,
                implementations: event.implementations,
              };
            }),
            internal: false,
          },
        },
      },
      hasService: {
        invoke: {
          src: (context) => () => {
            const iframe = document.getElementById(
              "iframe",
            ) as HTMLIFrameElement;

            if (!iframe || iframe.src) return;

            iframe.src = `${BASE_URL}/registry/editor/from-url?config=${compressToEncodedURIComponent(
              JSON.stringify(context.config),
            )}${
              context.layoutString ? `&layout=${context.layoutString}` : ""
            }&implementations=${compressToEncodedURIComponent(
              JSON.stringify(context.implementations),
            )}${getTokenHash(context.token)}`;
          },
        },
        on: {
          RECEIVE_SERVICE: {
            actions: [
              assign((_context, event) => {
                return {
                  config: event.config,
                  index: event.index,
                  uri: event.uri,
                  layoutString: event.layoutString,
                  token: event.token,
                  implementations: event.implementations,
                };
              }),
              "updateIframe",
            ],
          },
          RECEIVE_CONFIG_UPDATE_FROM_VSCODE: {
            cond: (ctx, event) => {
              // Ensure that the update is from the machine we are editing
              return event.uri === ctx.uri && ctx.index === event.index;
            },
            actions: [
              assign((ctx, event) => {
                return {
                  config: event.config,
                  layoutString: event.layoutString,
                  implementations: event.implementations,
                };
              }),
              "updateIframe",
            ],
          },
          DEFINITION_UPDATED: {
            actions: [
              assign((context, event) => {
                return {
                  config: event.config,
                  layoutString: event.layoutString,
                  implementations: event.implementations,
                };
              }),
              (ctx, event) => {
                getVsCodeApi().postMessage({
                  type: "vscode.updateDefinition",
                  config: event.config,
                  index: ctx.index,
                  uri: ctx.uri,
                  layoutString: event.layoutString,
                  implementations: event.implementations,
                });
              },
            ],
          },
        },
      },
    },
  },
  {
    actions: {
      updateIframe: (context) => {
        const iframe = document.getElementById("iframe") as HTMLIFrameElement;

        if (!iframe) return;

        iframe.contentWindow.postMessage(
          {
            config: context.config,
            layoutString: context.layoutString,
            type: "UPDATE_CONFIG",
            implementations: context.implementations,
          },
          "*",
        );
      },
    },
  },
);

interpret(machine).start();

const getTokenHash = (tokenInfo: TokenInfo) => {
  return `#access_token=${tokenInfo.token}&expires_in=${(
    tokenInfo.expiresAt -
    Date.now() / 1000
  ).toFixed(0)}&provider_token=${tokenInfo.providerToken}&refresh_token=${
    tokenInfo.refreshToken
  }&token_type=bearer`;
};
