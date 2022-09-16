import {
  getRangeFromSourceLocation,
  getSetOfNames,
} from '@xstate/tools-shared';
import { DiagnosticSeverity } from 'vscode-languageserver';
import { DiagnosticGetter } from '../getDiagnostics';

export const getUnusedServicesImplementations: DiagnosticGetter = (
  machineResult,
) => {
  const allServices = getSetOfNames(
    (machineResult.getAllServices(['named']) || []).map((invoke) => ({
      ...invoke,
      name: invoke.src,
    })),
  );

  const unusedServices =
    machineResult.ast?.options?.services?.properties.filter((service) => {
      return !allServices.has(service.key);
    });

  return (
    unusedServices?.map((service) => {
      return {
        message: `${service.key} is never used in the machine definition`,
        range: getRangeFromSourceLocation(service.keyNode.loc!),
        severity: DiagnosticSeverity.Warning,
      };
    }) || []
  );
};
