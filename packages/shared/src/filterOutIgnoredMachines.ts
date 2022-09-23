import type { ParseResult } from '@xstate/machine-extractor';

export const filterOutIgnoredMachines = (
  parseResult: ParseResult,
): ParseResult => {
  return {
    ...parseResult,
    machines: parseResult.machines.filter((machine) => !machine.getIsIgnored()),
  };
};
