import type { ParseResult } from "xstate-parser-demo";

export const filterOutIgnoredMachines = (
  parseResult: ParseResult,
): ParseResult => {
  return {
    ...parseResult,
    machines: parseResult.machines.filter((machine) => !machine.getIsIgnored()),
  };
};
