import {
  getRangeFromSourceLocation,
  getSetOfNames,
} from '@xstate/tools-shared';
import { DiagnosticSeverity } from 'vscode-languageserver';
import { DiagnosticGetter } from '../getDiagnostics';

export const getUnusedActionImplementations: DiagnosticGetter = (
  machineResult,
) => {
  const allActions = getSetOfNames(
    machineResult.getAllActions(['named']) || [],
  );

  const unusedActions = machineResult.ast?.options?.actions?.properties.filter(
    (action) => {
      return !allActions.has(action.key);
    },
  );

  return (
    unusedActions?.map((action) => {
      return {
        message: `${action.key} is never used in the machine definition`,
        range: getRangeFromSourceLocation(action.keyNode.loc!),
        severity: DiagnosticSeverity.Warning,
      };
    }) || []
  );
};
