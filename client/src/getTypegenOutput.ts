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
          matchesStates.push();
        }

        const internalEvents = collectInternalEvents([
          introspectResult.actions.lines,
          introspectResult.services.lines,
          introspectResult.guards.lines,
          introspectResult.delays.lines,
        ]);

        machine.allServices.forEach((service) => {
          if (service.id) {
            internalEvents.add(
              `'done.invoke.${service.id}': { type: 'done.invoke.${
                service.id
              }'; data: unknown; __tip: "Provide an event of type { type: 'done.invoke.${
                service.id
              }'; data: any } to strongly type this"; ${
                inlineInvocationName.test(service.id)
                  ? '__tip2: "Give this service an id property to clean up the event name"'
                  : ""
              } };`,
            );
            internalEvents.add(
              `'error.platform.${service.id}': { type: 'error.platform.${service.id}'; data: unknown; };`,
            );
          }
        });

        return `export interface Typegen${index} {
          '@@xstate/typegen': true;
          eventsCausingActions: {
            ${displayEventsCausing(introspectResult.actions.lines)}
          };
          internalEvents: {
            ${Array.from(internalEvents).join("\n")}
          };
          invokeSrcNameMap: {
            ${Object.keys(introspectResult.serviceSrcToIdMap)
              .map((src) => {
                // TODO - improve this so it picks up id
                // transitions
                return `'${src}': 'done.invoke.${introspectResult.serviceSrcToIdMap[src]}'`;
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

const inlineInvocationName = /done\.invoke\..{0,}:invocation\[.{0,}\]/;

const collectInternalEvents = (lineArrays: { events: string[] }[][]) => {
  const internalEvents = new Set<string>();

  lineArrays.forEach((lines) => {
    lines.forEach((line) => {
      line.events.forEach((event) => {
        if (event.startsWith("done.invoke")) {
          if (typeof event === "object") return;
          internalEvents.add(
            `'${event}': { type: '${event}'; data: unknown; __tip: "Provide an event of type { type: '${event}'; data: any } to strongly type this"; ${
              inlineInvocationName.test(event)
                ? '__tip2: "Give this service an id property to clean up the event name"'
                : ""
            } };`,
          );
        } else if (event.startsWith("xstate.") || event === "") {
          internalEvents.add(`'${event}': { type: '${event}' };`);
        } else if (event.startsWith("error.platform")) {
          internalEvents.add(
            `'${event}': { type: '${event}'; data: unknown; };`,
          );
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
