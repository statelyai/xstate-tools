import { MachineExtractResult } from '@xstate/machine-extractor';
import { TypegenData } from '@xstate/tools-shared';

export const getErrorMessage = (error: unknown): string => {
  if (
    !error ||
    typeof error !== 'object' ||
    !('message' in error) ||
    typeof error.message !== 'string'
  ) {
    return 'Unknown error';
  }
  return error.message;
};

export const isTypegenData = (
  typegenData: TypegenData | undefined,
): typegenData is TypegenData => typegenData !== undefined;

export const isTypedMachineResult = (machineResult: MachineExtractResult) =>
  machineResult.machineCallResult.definition?.tsTypes?.node !== undefined;
