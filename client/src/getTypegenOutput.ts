import { createMachine } from "xstate";
import { introspectMachine, XStateUpdateEvent } from "xstate-vscode-shared";
import { getStateMatchesObjectSyntax } from "./getStateMatchesObjectSyntax";

export const getTypegenOutput = (event: XStateUpdateEvent) => {
  return `
  // This file was automatically generated. Edits will be overwritten

  ${event.machines
    .filter((machine) => machine.hasTypesNode)
    .map((machine, index) => {
      try {
        const guards: Record<string, () => boolean> = {};

        machine.guardsToMock.forEach((guard) => {
          guards[guard] = () => true;
        });

        machine.config.context = {};

        // xstate-ignore-next-line
        const createdMachine = createMachine(machine.config || {}, {
          guards,
        });

        const introspectResult = introspectMachine(createdMachine as any);

        const requiredActions = introspectResult.actions.lines
          .filter((action) => !machine.actionsInOptions.includes(action.name))
          .map((action) => `'${action.name}'`)
          .join(" | ");

        const requiredServices = introspectResult.services.lines
          .filter(
            (service) => !machine.servicesInOptions.includes(service.name),
          )
          .map((service) => `'${service.name}'`)
          .join(" | ");

        const requiredGuards = introspectResult.guards.lines
          .filter((guard) => !machine.guardsInOptions.includes(guard.name))
          .map((guard) => `'${guard.name}'`)
          .join(" | ");

        const requiredDelays = introspectResult.delays.lines
          .filter((delay) => !machine.delaysInOptions.includes(delay.name))
          .map((delay) => `'${delay.name}'`)
          .join(" | ");

        const tags = machine.tags.map((tag) => `'${tag}'`).join(" | ");

        const matchesStates = introspectResult.stateMatches.map(
          (elem) => `'${elem}'`,
        );

        const objectSyntax = getStateMatchesObjectSyntax(introspectResult);

        if (objectSyntax) {
          matchesStates.push(objectSyntax);
        }

        const internalEvents = collectInternalEvents([
          introspectResult.actions.lines,
          introspectResult.services.lines,
          introspectResult.guards.lines,
          introspectResult.delays.lines,
        ]);

        machine.allServices.forEach((service) => {
          if (service.id) {
            internalEvents[
              `done.invoke.${service.id}`
            ] = `'done.invoke.${service.id}': { type: 'done.invoke.${service.id}'; data: unknown; __tip: "See the XState TS docs to learn how to strongly type this."; };`;
            internalEvents[
              `error.platform.${service.id}`
            ] = `'error.platform.${service.id}': { type: 'error.platform.${service.id}'; data: unknown; };`;
          }
        });

        return `export interface Typegen${index} {
          '@@xstate/typegen': true;
          eventsCausingActions: {
            ${displayEventsCausing(introspectResult.actions.lines)}
          };
          internalEvents: {
            ${Object.values(internalEvents).join("\n")}
          };
          invokeSrcNameMap: {
            ${Object.keys(introspectResult.serviceSrcToIdMap)
              .map((src) => {
                const set = Array.from(introspectResult.serviceSrcToIdMap[src]);

                return `'${src}': ${set
                  .map((item) => `'done.invoke.${item}'`)
                  .join(" | ")};`;
              })
              .join("\n")}
          }
          missingImplementations: {
            ${`actions: ${requiredActions || "never"};`}
            ${`services: ${requiredServices || "never"};`}
            ${`guards: ${requiredGuards || "never"};`}
            ${`delays: ${requiredDelays || "never"};`}
          }
          eventsCausingServices: {
            ${displayEventsCausing(introspectResult.services.lines)}
          };
          eventsCausingGuards: {
            ${displayEventsCausing(introspectResult.guards.lines)}
          };
          eventsCausingDelays: {
            ${displayEventsCausing(introspectResult.delays.lines)}
          };
          matchesStates: ${matchesStates.join(" | ") || "undefined"};
          tags: ${tags || "never"};
        }`;
      } catch (e) {
        console.log(e);
      }
      return `export interface Typegen${index} {
        // An error occured, so we couldn't generate the TS
        '@@xstate/typegen': false;
      };`;
    })
    .join("\n")}
  `;
};

const collectInternalEvents = (lineArrays: { events: string[] }[][]) => {
  const internalEvents: Record<string, string> = {};

  lineArrays.forEach((lines) => {
    lines.forEach((line) => {
      line.events.forEach((event) => {
        if (event.startsWith("done.invoke")) {
          internalEvents[
            event
          ] = `'${event}': { type: '${event}'; data: unknown; __tip: "See the XState TS docs to learn how to strongly type this."; };`;
        } else if (event.startsWith("xstate.") || event === "") {
          internalEvents[event] = `'${event}': { type: '${event}' };`;
        } else if (event.startsWith("error.platform")) {
          internalEvents[
            event
          ] = `'${event}': { type: '${event}'; data: unknown; };`;
        }
      });
    });
  });

  return internalEvents;
};

const displayEventsCausing = (lines: { name: string; events: string[] }[]) => {
  return lines
    .map((line) => {
      return `'${line.name}': ${
        unique(
          line.events.map((event) => {
            return event;
          }),
        )
          .map((event) => {
            return `'${event}'`;
          })
          .join(" | ") || "string"
      };`;
    })
    .join("\n");
};

const unique = <T>(array: T[]) => {
  return Array.from(new Set(array));
};
