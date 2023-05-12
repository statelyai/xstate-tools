import * as t from '@babel/types';
import { hashedId } from '../utils';
import { LiveMachineCallExpression } from './liveMachineCallExpression';

export function getLiveMachineExtractResult({
  file,
  fileContent,
  node,
}: {
  file: t.File;
  fileContent: string;
  node: t.CallExpression;
}) {
  const liveMachineCallResult = LiveMachineCallExpression.parse(node, {
    file,
    getNodeHash: (node: t.Node): string => {
      const fileText = fileContent.substring(node.start!, node.end!);
      return hashedId(fileText);
    },
  });
  return liveMachineCallResult && liveMachineCallResult.definition;
}
