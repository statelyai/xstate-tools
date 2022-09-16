import { StateSchema } from '@xstate/tools-shared';

// in the future we might want to control the outer quote type ourselves using an additional parameter, so let's use this helper throughout this file
const withSafeQuotes = (value: string) => JSON.stringify(value);

export const getStateMatchesObjectSyntax = (
  stateSchema: StateSchema,
): string => {
  const getUnionForSubState = (subState: StateSchema, depth = 0): string => {
    // Do not include sibling states in the union
    // if it's the root
    const states: string[] =
      depth === 0
        ? []
        : Object.keys(subState)
            .sort()
            .map((state) =>
              JSON.stringify(state, (_key, value) => {
                if (typeof value !== 'object') {
                  return value;
                }
                return Object.keys(value).reduce<Record<string, any>>(
                  (acc, key) => {
                    acc[key] = value[key];
                    return acc;
                  },
                  {},
                );
              }),
            );

    const substatesWithChildren = Object.entries(subState).filter(
      ([, value]) => {
        return Object.keys(value).length > 0;
      },
    );

    if (substatesWithChildren.length > 0) {
      states.push(
        `{ ${substatesWithChildren
          .sort(([stateA], [stateB]) => (stateA < stateB ? -1 : 1))
          .map(([state, value]) => {
            return `${withSafeQuotes(state)}?: ${getUnionForSubState(
              value,
              depth + 1,
            )};`;
          })
          .join('\n')} }`,
      );
    }
    return `${states.join(' | ')}`;
  };

  return getUnionForSubState(stateSchema);
};
