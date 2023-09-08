import { inspect } from '@xstate/inspect';
import { ExtractorMachineConfig } from '@xstate/machine-extractor';
import { assign, createMachine, interpret, MachineConfig } from 'xstate';

export interface WebViewMachineContext {
  config: ExtractorMachineConfig;
  guardsToMock: string[];
}

export type VizWebviewMachineEvent =
  | {
      type: 'RECEIVE_SERVICE';
      config: ExtractorMachineConfig;
      guardsToMock: string[];
    }
  | {
      type: 'UPDATE';
      config: ExtractorMachineConfig;
      guardsToMock: string[];
    };

const machine = createMachine<WebViewMachineContext, VizWebviewMachineEvent>({
  initial: 'waitingForFirstContact',
  context: {
    config: {},
    guardsToMock: [],
  },
  invoke: {
    src: () => (send) => {
      window.addEventListener('message', (event) => {
        try {
          send(event.data);
        } catch (e) {
          console.warn(e);
        }
      });
    },
  },
  on: {
    RECEIVE_SERVICE: {
      target: '.hasService',
      actions: assign((context, event) => {
        return {
          config: event.config,
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
          target: '.startingInspector',
          actions: assign((context, event) => {
            return {
              config: event.config,
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
              document.getElementById('iframe') as HTMLIFrameElement,
            url: `https://xstate-viz-git-farskid-embedded-mode-statelyai.vercel.app/viz/embed?inspect&zoom=1&pan=1&controls=1`,
          });

          return () => {
            inspector!.disconnect();
          };
        },
      },
      initial: 'startingInspector',
      states: {
        startingInspector: {
          after: {
            100: 'startingInterpreter',
          },
        },
        startingInterpreter: {
          invoke: {
            src: (context) => () => {
              const guards: Record<string, () => boolean> = {};

              context.guardsToMock.forEach((guard) => {
                guards[guard] = () => true;
              });

              const machine = createMachine(
                {
                  ...context.config,
                  context: {},
                },
                {
                  guards,
                },
              );

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
