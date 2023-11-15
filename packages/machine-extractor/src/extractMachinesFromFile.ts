import { getMachineExtractResult } from './getMachineExtractResult';
import { getMachineNodesFromFile } from './getMachineNodesFromFile';
import { ALLOWED_CALL_EXPRESSION_NAMES } from './machineCallExpression';
import { FileExtractResult } from './types';

export const extractMachinesFromFile = (
  fileContent: string,
): FileExtractResult | null => {
  if (
    !ALLOWED_CALL_EXPRESSION_NAMES.some((name) => fileContent.includes(name))
  ) {
    return null;
  }

  const { file, machineNodes } = getMachineNodesFromFile(fileContent);
  const machines = machineNodes.map((node) =>
    getMachineExtractResult({
      file,
      fileContent,
      node,
    }),
  );

  return {
    machines,
    options: machines.map((m) => m?.getAllMachineOptions()),
    file,
  };
};
