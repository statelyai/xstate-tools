import { DiagnosticSeverity } from "vscode-languageserver";
import { DiagnosticGetter } from "../getDiagnostics";
import { getRangeFromSourceLocation } from "../getRangeFromSourceLocation";

// TODO - add checker for conds and services
export const getUnusedServicesImplementations: DiagnosticGetter = (
  machine,
  textDocument,
) => {
  const allServices = Object.keys(
    machine.parseResult?.getAllNamedServices() || {},
  );

  const unusedServices =
    machine.parseResult?.ast?.options?.services?.properties.filter(
      (service) => {
        return !allServices.includes(service.key);
      },
    );

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
