import { getTsdk } from '@volar/vscode';
import * as vscode from 'vscode';
import { assertEvent, assign, createActor, fromPromise, setup } from 'xstate';
import { languageClientMachine } from './languageClient';
import { assertDefined, assertExtendedEvent } from './utils';

const extensionMachine = setup({
  types: {} as {
    context: {
      extensionContext: vscode.ExtensionContext | undefined;
    };
    events:
      | { type: 'ACTIVATE'; extensionContext: vscode.ExtensionContext }
      | { type: 'DEACTIVATE' };
  },
  actions: {
    assignExtensionContext: assign(({ event }) => {
      assertEvent(event, 'ACTIVATE');
      return { extensionContext: event.extensionContext };
    }),
  },
  actors: {
    getTsdk: fromPromise(
      async ({
        input: extensionContext,
      }: {
        input: vscode.ExtensionContext;
      }) => ({ tsdk: (await getTsdk(extensionContext)).tsdk }),
    ),
    languageClient: languageClientMachine,
  },
}).createMachine({
  context: {
    extensionContext: undefined,
  },
  initial: 'idle',
  states: {
    idle: {
      on: {
        ACTIVATE: {
          target: 'active',
          actions: 'assignExtensionContext',
        },
      },
    },
    active: {
      initial: 'starting',
      states: {
        starting: {
          invoke: {
            src: 'getTsdk',
            id: 'getTsdk',
            input: ({ context }) => {
              assertDefined(context.extensionContext);
              return context.extensionContext;
            },
            onDone: {
              target: 'running',
            },
          },
        },
        running: {
          invoke: {
            src: 'languageClient',
            input: ({ context, event }) => {
              assertDefined(context.extensionContext);

              const extendedEvent = assertExtendedEvent<
                typeof event,
                {
                  type: 'xstate.done.actor.getTsdk';
                  output: Pick<Awaited<ReturnType<typeof getTsdk>>, 'tsdk'>;
                }
              >(event, 'xstate.done.actor.getTsdk');

              return {
                extensionContext: context.extensionContext,
                tsdk: extendedEvent.output.tsdk,
                isServerEnabled:
                  vscode.workspace
                    .getConfiguration('xstate')
                    .get('server.enabled') ?? true,
              };
            },
          },
        },
      },
      on: {
        DEACTIVATE: 'deactivated',
      },
    },
    deactivated: {
      type: 'final',
    },
  },
});

const extensionActorRef = createActor(extensionMachine).start();

export async function activate(context: vscode.ExtensionContext) {
  extensionActorRef.send({ type: 'ACTIVATE', extensionContext: context });
}

export async function deactivate() {
  extensionActorRef.send({ type: 'DEACTIVATE' });
}
