import { getStateMatchesObjectSyntax } from './getStateMatchesObjectSyntax';
import { TypegenData } from './getTypegenData';
import { StateSchema } from './introspectMachine';

// in the future we might want to control the outer quote type ourselves using an additional parameter, so let's use this helper throughout this file
const withSafeQuotes = (value: string) => JSON.stringify(value);

export const getTypegenOutput = (types: TypegenData[]) => {
  return `
  // This file was automatically generated. Edits will be overwritten

  ${types
    .map(({ data: typegenData }, index) => {
      return `export interface Typegen${index} {
        '@@xstate/typegen': true;
        internalEvents: {
          ${typegenData.internalEvents
            .map((event) => {
              const safeEvent = withSafeQuotes(event);
              if (event.startsWith('done.invoke.')) {
                return `${safeEvent}: { type: ${safeEvent} }; data: unknown; __tip: "See the XState TS docs to learn how to strongly type this.";`;
              }
              if (event.startsWith('error.platform.')) {
                return `${safeEvent}: { type: ${safeEvent}; data: unknown };`;
              }
              return `${safeEvent}: { type: ${safeEvent} };`;
            })
            .join('\n')}
        };
        invokeSrcNameMap: {
          ${Object.entries(typegenData.serviceSrcToIdMap)
            .map(
              ([src, ids]) =>
                `${withSafeQuotes(src)}: ${toUnion(
                  ids.map((id) => `done.invoke.${id}`),
                )};`,
            )
            .join('\n')}
        };
        missingImplementations: {
          actions: ${toUnionOrNever(
            typegenData.missingImplementations.actions,
          )};
          delays: ${toUnionOrNever(typegenData.missingImplementations.delays)};
          guards: ${toUnionOrNever(typegenData.missingImplementations.guards)};
          services: ${toUnionOrNever(
            typegenData.missingImplementations.services,
          )};
        };
        eventsCausingActions: {
          ${Object.entries(typegenData.eventsCausingActions).map(
            ([action, events]) =>
              `${withSafeQuotes(action)}: ${toUnionOrNever(events)};`,
          )}
        };
        eventsCausingDelays: {
          ${Object.entries(typegenData.eventsCausingDelays).map(
            ([delay, events]) =>
              `${withSafeQuotes(delay)}: ${toUnionOrNever(events)};`,
          )}
        };
        eventsCausingGuards: {
          ${Object.entries(typegenData.eventsCausingGuards).map(
            ([guard, events]) =>
              `${withSafeQuotes(guard)}: ${toUnionOrNever(events)};`,
          )}
        };
        eventsCausingServices: {
          ${Object.entries(typegenData.eventsCausingServices).map(
            ([service, events]) =>
              `${withSafeQuotes(service)}: ${toUnionOrNever(events)};`,
          )}
        };
        matchesStates: ${printMatchesStates(typegenData.stateSchema)};
        tags: ${toUnionOrNever(typegenData.tags)};
      }`;
    })
    .join('\n\n')}
  `;
};

const toPaths = (stateSchema: StateSchema): string[] => {
  return Object.entries(stateSchema).flatMap(([key, value]) => [
    key,
    ...toPaths(value).map((path) => `${key}.${path}`),
  ]);
};

const printMatchesStates = (stateSchema: StateSchema) => {
  return Object.keys(stateSchema).length
    ? `${toUnion(toPaths(stateSchema).sort())} | ${getStateMatchesObjectSyntax(
        stateSchema,
      )}`
    : 'undefined';
};

const toUnion = (arr: string[]) => arr.map(withSafeQuotes).join(' | ');

const toUnionOrNever = (arr: string[]) => (arr.length ? toUnion(arr) : 'never');
