import { inspect } from "@xstate/inspect";
import { assign } from "xstate";
import { MachineConfig } from "xstate";
import { interpret } from "xstate";
import { createMachine } from "xstate";

export interface WebViewMachineContext {
  config: MachineConfig<any, any, any>;
  uri: string;
  index: number;
  guardsToMock: string[];
}

export type VizWebviewMachineEvent =
  | {
      type: "RECEIVE_SERVICE";
      config: MachineConfig<any, any, any>;
      uri: string;
      index: number;
      guardsToMock: string[];
    }
  | {
      type: "UPDATE";
      config: MachineConfig<any, any, any>;
      uri: string;
      index: number;
      guardsToMock: string[];
    };

const machine = createMachine<WebViewMachineContext, VizWebviewMachineEvent>({
  initial: "waitingForFirstContact",
  context: {
    config: {},
    uri: "",
    index: 0,
    guardsToMock: [],
  },
  invoke: {
    src: () => (send) => {
      window.addEventListener("message", (event) => {
        try {
          send(JSON.parse(event.data));
        } catch (e) {
          console.warn(e);
        }
      });
    },
  },
  on: {
    RECEIVE_SERVICE: {
      target: ".hasService",
      actions: assign((context, event) => {
        return {
          config: event.config,
          index: event.index,
          uri: event.uri,
          guardsToMock: event.guardsToMock,
        };
      }),
      internal: false,
    },
  },

  states: {
    waitingForFirstContact: {},
    hasService: {
      on: {
        UPDATE: {
          cond: (context, event) => {
            return context.uri === event.uri && context.index === event.index;
          },
          target: ".startingInspector",
          actions: assign((context, event) => {
            return {
              config: event.config,
              index: event.index,
              uri: event.uri,
              guardsToMock: event.guardsToMock,
            };
          }),
          internal: false,
        },
      },
      invoke: {
        src: () => () => {
          const inspector = inspect({
            iframe: () =>
              document.getElementById("iframe") as HTMLIFrameElement,
            url: `https://xstate-viz-git-farskid-embedded-mode-statelyai.vercel.app/viz/embed?inspect&zoom=1&pan=1&controls=1`,
          });

          return () => {
            inspector.disconnect();
          };
        },
      },
      initial: "startingInspector",
      states: {
        startingInspector: {
          after: {
            100: "startingInterpreter",
          },
        },
        startingInterpreter: {
          invoke: {
            src: (context) => (send) => {
              const guards: Record<string, () => boolean> = {};

              context.guardsToMock.forEach((guard) => {
                guards[guard] = () => true;
              });

              context.config.context = {};

              const machine = createMachine(context.config || {}, {
                guards,
              });

              const service = interpret(machine, {
                devTools: true,
              }).start();

              return () => {
                service.stop();
              };
            },
          },
        },
      },
    },
  },
});

interpret(machine).start();
