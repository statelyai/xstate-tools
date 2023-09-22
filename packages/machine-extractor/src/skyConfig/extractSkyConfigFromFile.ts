import { getMachineNodesFromFile } from '../getMachineNodesFromFile';
import { getSkyConfigExtractResult } from './getSkyConfigExtractResult';
import { ALLOWED_SKY_CONFIG_CALL_EXPRESSION_NAMES } from './skyConfigUtils';

export const extractSkyConfigFromFile = (fileContent: string) => {
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
      getSkyConfigExtractResult({
        file,
        fileContent,
        node,
      }),
    ),
    file,
  };
};
