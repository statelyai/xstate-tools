import { getMachineNodesFromFile } from '../getMachineNodesFromFile';
import { getLiveMachineExtractResult } from './getLiveMachineExtractResult';
import { ALLOWED_LIVE_CALL_EXPRESSION_NAMES } from './liveMachineUtils';

export const extractLiveMachinesFromFile = (fileContent: string) => {
  if (
    !ALLOWED_LIVE_CALL_EXPRESSION_NAMES.some((name) =>
      fileContent.includes(name),
    )
  ) {
    return null;
  }

  const { file, machineNodes } = getMachineNodesFromFile(fileContent);

  return {
    liveMachines: machineNodes.map((node) =>
      getLiveMachineExtractResult({
        file,
        fileContent,
        node,
      }),
    ),
    file,
  };
};
