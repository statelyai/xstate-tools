import { createMachine } from 'xstate';
import { getStateMatchesObjectSyntax } from './getStateMatchesObjectSyntax';
import { introspectMachine } from './introspectMachine';
import { XStateUpdateMachine } from './types';

export const getTypegenOutput = (event: {
  machines: Pick<
    XStateUpdateMachine,
    | 'hasTypesNode'
    | 'config'
    | 'namedGuards'
    | 'namedActions'
    | 'actionsInOptions'
    | 'guardsInOptions'
    | 'servicesInOptions'
    | 'delaysInOptions'
    | 'tags'
    | 'allServices'
    | 'chooseActionsInOptions'
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
          actions: {
            ...machine.chooseActionsInOptions,
          },
        });

        const introspectResult = introspectMachine(createdMachine as any);

        const actions = introspectResult.actions.lines
          .filter((line) => !line.name.startsWith('xstate.'))
          .filter((action) => machine.namedActions.includes(action.name));
        const guards = introspectResult.guards.lines
          .filter((line) => !line.name.startsWith('xstate.'))
          .filter((elem) => machine.namedGuards.includes(elem.name));

        const services = introspectResult.services.lines
          .filter((line) => !line.name.startsWith('xstate.'))
          .filter((invoke) =>
            machine.allServices.some((service) => service.src === invoke.name),
          );

        const delays = introspectResult.delays.lines.filter(
          (line) => !line.name.startsWith('xstate.'),
        );

        const requiredActions = actions
          .filter((action) => !machine.actionsInOptions.includes(action.name))
          .sort()
          .map((action) => JSON.stringify(action.name))
          .join(' | ');

        const requiredServices = services
          .filter(
            (service) => !machine.servicesInOptions.includes(service.name),
          )
          .sort()
          .map((service) => JSON.stringify(service.name))
          .join(' | ');

        const requiredGuards = guards
          .filter((guard) => !machine.guardsInOptions.includes(guard.name))
          .sort()
          .map((guard) => JSON.stringify(guard.name))
          .join(' | ');

        const requiredDelays = delays
          .filter((delay) => !machine.delaysInOptions.includes(delay.name))
          .sort()
          .map((delay) => JSON.stringify(delay.name))
          .join(' | ');

        const tags = machine.tags
          .sort()
          .map((tag) => JSON.stringify(tag))
          .join(' | ');

        const matchesStates = introspectResult.stateMatches
          .sort()
          .map((candidate) => JSON.stringify(candidate));

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
          'xstate.init'
        ] = `'xstate.init': { type: 'xstate.init' };`;

        machine.allServices.forEach((service) => {
          if (service.id) {
            internalEvents[`done.invoke.${service.id}`] = `${JSON.stringify(
              `done.invoke.${service.id}`,
            )}: { type: ${JSON.stringify(
              `done.invoke.${service.id}`,
            )}; data: unknown; __tip: "See the XState TS docs to learn how to strongly type this."; };`;
            internalEvents[`error.platform.${service.id}`] = `${JSON.stringify(
              `error.platform.${service.id}`,
            )}: { type: ${JSON.stringify(
              `error.platform.${service.id}`,
            )}; data: unknown; };`;
          }
        });

        return `export interface Typegen${index} {
          '@@xstate/typegen': true;
          internalEvents: {
            ${Object.entries(internalEvents)
              .sort(([keyA], [keyB]) => (keyA < keyB ? -1 : 1))
              .map(([, value]) => value)
              .join('\n')}
          };
          invokeSrcNameMap: {
            ${Array.from(introspectResult.serviceSrcToIdMap)
              .filter(([src]) => {
                return machine.allServices.some(
                  (service) => service.src === src,
                );
              })
              .sort(([srcA], [srcB]) => (srcA < srcB ? -1 : 1))
              .map(([src, ids]) => {
                return `${JSON.stringify(src)}: ${Array.from(ids)
                  .map((item) => JSON.stringify(`done.invoke.${item}`))
                  .join(' | ')};`;
              })
              .join('\n')}
          };
          missingImplementations: {
            ${`actions: ${requiredActions || 'never'};`}
            ${`services: ${requiredServices || 'never'};`}
            ${`guards: ${requiredGuards || 'never'};`}
            ${`delays: ${requiredDelays || 'never'};`}
          };
          eventsCausingActions: {
            ${displayEventsCausing(actions)}
          };
          eventsCausingServices: {
            ${displayEventsCausing(services)}
          };
          eventsCausingGuards: {
            ${displayEventsCausing(guards)}
          };
          eventsCausingDelays: {
            ${displayEventsCausing(delays)}
          };
          matchesStates: ${matchesStates.join(' | ') || 'undefined'};
          tags: ${tags || 'never'};
        }`;
      } catch (e) {
        console.log(e);
      }
      return `export interface Typegen${index} {
        // An error occured, so we couldn't generate the TS
        '@@xstate/typegen': false;
      };`;
    })
    .join('\n')}
  `;
};

const collectInternalEvents = (lineArrays: { events: string[] }[][]) => {
  const internalEvents: Record<string, string> = {};

  lineArrays.forEach((lines) => {
    lines.forEach((line) => {
      line.events.forEach((event) => {
        const safelyQuoted = JSON.stringify(event);
        if (event.startsWith('done.invoke')) {
          internalEvents[
            event
          ] = `${safelyQuoted}: { type: ${safelyQuoted}; data: unknown; __tip: "See the XState TS docs to learn how to strongly type this."; };`;
        } else if (event.startsWith('xstate.') || event === '') {
          const safelyQuoted = JSON.stringify(event);
          internalEvents[event] = `${safelyQuoted}: { type: ${safelyQuoted} };`;
        } else if (event.startsWith('error.platform')) {
          internalEvents[
            event
          ] = `${safelyQuoted}: { type: ${safelyQuoted}; data: unknown; };`;
        }
      });
    });
  });

  return internalEvents;
};

const displayEventsCausing = (lines: { name: string; events: string[] }[]) => {
  return lines
    .sort((lineA, lineB) => (lineA.name < lineB.name ? -1 : 1))
    .map((line) => {
      return `${JSON.stringify(line.name)}: ${
        line.events.length
          ? unique(
              line.events.map((event) => {
                return event;
              }),
            )
              .map((event) => JSON.stringify(event))
              .sort()
              .join(' | ')
          : 'never'
      };`;
    })
    .join('\n');
};

const unique = <T>(array: T[]) => {
  return Array.from(new Set(array));
};
