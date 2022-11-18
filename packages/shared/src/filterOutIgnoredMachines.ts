import type {
  FileExtractResult,
  MachineExtractResult,
} from '@xstate/machine-extractor';

export const isMachineResult = (
  machineResult: MachineExtractResult | undefined,
): machineResult is MachineExtractResult => machineResult !== undefined;

export const filterOutIgnoredMachines = (
  parseResult: FileExtractResult,
): FileExtractResult<MachineExtractResult> => {
  return {
    ...parseResult,
    machines: parseResult.machines
      .filter(isMachineResult)
      .filter((machine) => !machine.getIsIgnored()),
  };
};
