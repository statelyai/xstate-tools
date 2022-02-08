import * as fs from "fs";
import * as os from "os";
import * as prettier from "prettier";
import { promisify } from "util";
import * as vscode from "vscode";
import { assign, createMachine, interpret } from "xstate";
import { XStateUpdateEvent, getTypegenOutput } from "xstate-vscode-shared";

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

            const pathToSave = pathFromUri.replace(
              /\.([j,t])sx?$/,
              ".typegen.ts",
            );

            const prettierConfig = await prettier.resolveConfig(pathFromUri);

            try {
              if (
                event.machines.filter((machine) => machine.hasTypesNode)
                  .length > 0
              ) {
                const typegenOutput = getTypegenOutput(event);
                await promisify(fs.writeFile)(
                  pathToSave,
                  prettier.format(typegenOutput, {
                    ...prettierConfig,
                    parser: "typescript",
                  }),
                );
              } else if (await promisify(fs.exists)(pathToSave)) {
                await promisify(fs.unlink)(pathToSave);
              }
            } catch (e) {
              console.log(e);
            }
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
