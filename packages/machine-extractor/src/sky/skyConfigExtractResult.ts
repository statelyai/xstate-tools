import * as t from '@babel/types';
import { hashedId } from '../utils';
import { SkyConfigCallExpression } from './skyConfigCallExpression';
import { getClosestEnvFile, getEnvValue } from './skyEnvFileUtils';

export function skyConfigExtractResult({
  file,
  fileContent,
  filePath,
  cwd,
  node,
}: {
  file: t.File;
  fileContent: string;
  filePath: string;
  cwd: string;
  node: t.CallExpression;
}) {
  const skyConfigCallResult = SkyConfigCallExpression.parse(node, {
    file,
    getNodeHash: (node: t.Node): string => {
      const fileText = fileContent.substring(node.start!, node.end!);
      return hashedId(fileText);
    },
    getNodeSource: (node: t.Node): string => {
      return fileContent.substring(node.start!, node.end!);
    },
    getEnvVariable: (name: string): string | undefined => {
      if (process.env[name]) {
        return process.env[name];
      }
      const envFileContents = getClosestEnvFile({ filePath, cwd });
      return getEnvValue(envFileContents, name);
    },
  });
  return skyConfigCallResult && skyConfigCallResult.definition;
}
