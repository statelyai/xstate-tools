import type { FileExtractResult } from '@xstate/machine-extractor';

export const filterOutIgnoredMachines = (
  parseResult: FileExtractResult,
): FileExtractResult => {
  return {
    ...parseResult,
    machines: parseResult.machines.filter(
      (machine) => !!machine && !machine.getIsIgnored(),
    ),
  };
};
