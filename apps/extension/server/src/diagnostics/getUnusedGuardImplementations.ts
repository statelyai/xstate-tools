import {
  getRangeFromSourceLocation,
  getSetOfNames,
} from '@xstate/tools-shared';
import { DiagnosticSeverity } from 'vscode-languageserver';
import { DiagnosticGetter } from '../getDiagnostics';

export const getUnusedGuardsImplementations: DiagnosticGetter = (
  machineResult,
) => {
  const allGuards = getSetOfNames(machineResult.getAllConds(['named']) || []);

  const unusedGuards =
    machineResult.machineCallResult?.options?.guards?.properties.filter(
      (guard) => {
        return !allGuards.has(guard.key);
      },
    );

  return (
    unusedGuards?.map((guard) => {
      return {
        message: `${guard.key} is never used in the machine definition`,
        range: getRangeFromSourceLocation(guard.keyNode.loc!),
        severity: DiagnosticSeverity.Warning,
      };
    }) || []
  );
};
