import * as t from '@babel/types';
import { MachineCallExpression } from './machineCallExpression';
import { MachineExtractResult } from './MachineExtractResult';
import { hashedId } from './utils';

export function getMachineExtractResult({
  file,
  fileContent,
  node,
}: {
  file: t.File;
  fileContent: string;
  node: t.CallExpression;
}) {
  const machineCallResult = MachineCallExpression.parse(node, {
    file,
    getNodeHash: (node: t.Node): string => {
      const fileText = fileContent.substring(node.start!, node.end!);
      return hashedId(fileText);
    },
  });

  return (
    machineCallResult &&
    new MachineExtractResult({
      fileAst: file,
      fileContent,
      machineCallResult,
    })
  );
}
