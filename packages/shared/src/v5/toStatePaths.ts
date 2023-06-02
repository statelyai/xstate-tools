import { StateValue } from 'xstate5';

export function toStatePaths(stateValue: StateValue | undefined): string[][] {
  if (!stateValue) {
    return [[]];
  }

  if (typeof stateValue === 'string') {
    return [[stateValue]];
  }

  const result = Object.keys(stateValue).flatMap((key) => {
    const subStateValue = stateValue[key];

    if (
      typeof subStateValue !== 'string' &&
      (!subStateValue || !Object.keys(subStateValue).length)
    ) {
      return [[key]];
    }

    return toStatePaths(stateValue[key]).map((subPath) => {
      return [key].concat(subPath);
    });
  });

  return result;
}
