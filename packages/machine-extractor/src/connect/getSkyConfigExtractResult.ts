import * as t from '@babel/types';
import { hashedId } from '../utils';
import { SkyConfigCallExpression } from './skyConfigCallExpression';

export function getSkyConfigExtractResult({
  file,
  fileContent,
  node,
}: {
  file: t.File;
  fileContent: string;
  node: t.CallExpression;
}) {
  const skyConfigCallResult = SkyConfigCallExpression.parse(node, {
    file,
    getNodeHash: (node: t.Node): string => {
      const fileText = fileContent.substring(node.start!, node.end!);
      return hashedId(fileText);
    },
  });
  return skyConfigCallResult && skyConfigCallResult.definition;
}
