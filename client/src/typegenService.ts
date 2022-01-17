import * as fs from "fs";
import * as path from "path";
import * as prettier from "prettier";
import { promisify } from "util";
import * as vscode from "vscode";
import { assign, createMachine, interpret } from "xstate";
import { XStateUpdateEvent } from "xstate-vscode-shared";
import { getTypegenOutput } from "./getTypegenOutput";

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

            const newUri = vscode.Uri.file(
              uri.replace(/\.([j,t])sx?$/, ".typegen.ts"),
            );

            const pathToSave = path.resolve(newUri.path).slice(6);

            const prettierConfig = await prettier.resolveConfig(pathToSave);

            if (
              event.machines.filter((machine) => machine.hasTypesNode).length >
              0
            ) {
              await promisify(fs.writeFile)(
                pathToSave,
                prettier.format(getTypegenOutput(event), {
                  ...prettierConfig,
                  parser: "typescript",
                }),
              );
            } else {
              await promisify(fs.unlink)(path.resolve(newUri.path).slice(6));
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
