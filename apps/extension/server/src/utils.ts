import { MachineExtractResult } from '@xstate/machine-extractor';
import { TextEdit, TypegenData } from '@xstate/tools-shared';

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

// this assumes that the latter (layout) edit might be contained in the previous edit (config)
// it doesn't handle the reverse case
export const mergeOverlappingEdits = (edits: TextEdit[]): TextEdit[] => {
  const mergedEdits: TextEdit[] = [];

  for (const edit of edits) {
    const existingEdit = mergedEdits.find(
      (otherEdit) =>
        edit.range[0].index >= otherEdit.range[0].index &&
        edit.range[1].index <= otherEdit.range[1].index,
    );

    if (!existingEdit) {
      mergedEdits.push(edit);
      continue;
    }

    const oldLength = edit.range[1].index - edit.range[0].index;

    const newTextStart = edit.range[0].index - existingEdit.range[0].index;

    // we only mutate the `newText` because `range` refers to positions in the old source code
    // and we still want to affect the same old range
    existingEdit.newText =
      existingEdit.newText.slice(0, newTextStart) +
      edit.newText +
      existingEdit.newText.slice(newTextStart + oldLength);
  }

  return mergedEdits;
};
