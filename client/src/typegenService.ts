import * as os from "os";
import * as vscode from "vscode";
import { assign, createMachine, interpret } from "xstate";
import { writeToTypegenFile, XStateUpdateEvent } from "xstate-tools-shared";

const throttledTypegenCreationMachine = createMachine<
  {
    eventMap: Record<string, XStateUpdateEvent>;
  },
  { type: "RECEIVE_NEW_EVENT"; event: XStateUpdateEvent }
>(
  {
    initial: "idle",
    context: {
      eventMap: {},
    },
    preserveActionOrder: true,
    on: {
      RECEIVE_NEW_EVENT: {
        target: ".throttling",
        internal: false,
        actions: assign((context, event) => {
          return {
            eventMap: {
              ...context.eventMap,
              [event.event.uri]: event.event,
            },
          };
        }),
      },
    },
    states: {
      idle: {
        entry: ["executeAction", "clearActions"],
      },
      throttling: {
        after: {
          500: "idle",
        },
      },
    },
  },
  {
    actions: {
      executeAction: async (context) => {
        await Promise.all([
          Object.entries(context.eventMap).map(async ([, event]) => {
            const uri = event.uri;
            let pathFromUri = vscode.Uri.parse(uri, true).path;
            if (os.platform() === "win32") {
              pathFromUri = pathFromUri.slice(1);
            }

            await writeToTypegenFile({
              filePath: pathFromUri,
              event,
            });
          }),
        ]);
      },
      clearActions: assign(() => {
        return {
          eventMap: {},
        };
      }),
    },
  },
);

export const startTypegenService = () =>
  interpret(throttledTypegenCreationMachine).start();
