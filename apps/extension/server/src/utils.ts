import { MachineExtractResult } from '@xstate/machine-extractor';
import { TypegenData } from '@xstate/tools-shared';

export const isErrorWithMessage = (
  error: unknown,
): error is {
  message: string;
} =>
  typeof error === 'object' &&
  error !== null &&
  'message' in error &&
  typeof (error as Record<string, unknown>).message === 'string';

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
