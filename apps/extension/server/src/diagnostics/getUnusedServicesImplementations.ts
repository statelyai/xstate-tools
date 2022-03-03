import { DiagnosticSeverity } from "vscode-languageserver";
import { DiagnosticGetter } from "../getDiagnostics";
import {
  getRangeFromSourceLocation,
  getSetOfNames,
} from "@xstate/tools-shared";

export const getUnusedServicesImplementations: DiagnosticGetter = (
  machine,
  textDocument,
) => {
  const allServices = getSetOfNames(
    (machine.parseResult?.getAllServices(["named"]) || []).map((invoke) => ({
      ...invoke,
      name: invoke.src,
    })),
  );

  const unusedServices =
    machine.parseResult?.ast?.options?.services?.properties.filter(
      (service) => {
        return !allServices.has(service.key);
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
