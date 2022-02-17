import { createMachine } from "xstate";
import { introspectMachine } from "./introspectMachine";
import { getStateMatchesObjectSyntax } from "./getStateMatchesObjectSyntax";
import { XStateUpdateMachine } from "./types";

export const getTypegenOutput = (event: {
  machines: Pick<
    XStateUpdateMachine,
    | "hasTypesNode"
    | "config"
    | "guardsToMock"
    | "actionsInOptions"
    | "guardsInOptions"
    | "servicesInOptions"
    | "delaysInOptions"
    | "tags"
    | "allServices"
  >[];
}) => {
  return `
  // This file was automatically generated. Edits will be overwritten

  ${event.machines
    .filter((machine) => machine.hasTypesNode)
    .map((machine, index) => {
      try {
        const guardsToMock: Record<string, () => boolean> = {};

        machine.namedGuards.forEach((guard) => {
          guardsToMock[guard] = () => false;
        });

        machine.config.context = {};

        // xstate-ignore-next-line
        const createdMachine = createMachine(machine.config || {}, {
          guards: guardsToMock,
        });

        const introspectResult = introspectMachine(createdMachine as any);

        const actions = introspectResult.actions.lines
          .filter((line) => !line.name.startsWith("xstate."))
          .filter((action) => machine.namedActions.includes(action.name));
        const guards = introspectResult.guards.lines
          .filter((line) => !line.name.startsWith("xstate."))
          .filter((elem) => machine.namedGuards.includes(elem.name));

        const services = introspectResult.services.lines
          .filter((line) => !line.name.startsWith("xstate."))
          .filter((invoke) =>
            machine.allServices.some((service) => service.src === invoke.name),
          );

        const delays = introspectResult.delays.lines.filter(
          (line) => !line.name.startsWith("xstate."),
        );

        const requiredActions = actions
          .filter((action) => !machine.actionsInOptions.includes(action.name))
          .map((action) => `'${action.name}'`)
          .join(" | ");

        const requiredServices = services
          .filter(
            (service) => !machine.servicesInOptions.includes(service.name),
          )
          .map((service) => `'${service.name}'`)
          .join(" | ");

        const requiredGuards = guards
          .filter((guard) => !machine.guardsInOptions.includes(guard.name))
          .map((guard) => `'${guard.name}'`)
          .join(" | ");

        const requiredDelays = delays
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

        internalEvents[
          "xstate.init"
        ] = `'xstate.init': { type: 'xstate.init' };`;

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
            ${displayEventsCausing(actions)}
          };
          internalEvents: {
            ${Object.values(internalEvents).join("\n")}
          };
          invokeSrcNameMap: {
            ${Object.keys(introspectResult.serviceSrcToIdMap)
              .filter((src) => {
                return machine.allServices.some(
                  (service) => service.src === src,
                );
              })
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
            ${displayEventsCausing(services)}
          };
          eventsCausingGuards: {
            ${displayEventsCausing(guards)}
          };
          eventsCausingDelays: {
            ${displayEventsCausing(delays)}
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
          .join(" | ") ||
        /**
         * If no transitions go to this guard/service/action, it's guaranteed
         * to be caused by xstate.init.
         */
        "'xstate.init'"
      };`;
    })
    .join("\n");
};

const unique = <T>(array: T[]) => {
  return Array.from(new Set(array));
};
