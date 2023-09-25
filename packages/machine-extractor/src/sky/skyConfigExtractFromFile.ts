import { getMachineNodesFromFile } from '../getMachineNodesFromFile';
import { skyConfigExtractResult } from './skyConfigExtractResult';
import { ALLOWED_SKY_CONFIG_CALL_EXPRESSION_NAMES } from './skyConfigUtils';

export const skyConfigExtractFromFile = (fileContent: string) => {
  if (
    !ALLOWED_SKY_CONFIG_CALL_EXPRESSION_NAMES.some((name) =>
      fileContent.includes(name),
    )
  ) {
    return null;
  }

  const { file, machineNodes } = getMachineNodesFromFile(fileContent);

  return {
    skyConfigs: machineNodes.map((node) =>
      skyConfigExtractResult({
        file,
        fileContent,
        node,
      }),
    ),
    file,
  };
};
