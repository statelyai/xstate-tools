import { DiagnosticSeverity } from "vscode-languageserver";
import { DiagnosticGetter } from "../getDiagnostics";
import { getRangeFromSourceLocation } from "xstate-vscode-shared";

// TODO - add checker for conds and guards
export const getUnusedGuardsImplementations: DiagnosticGetter = (
  machine,
  textDocument,
) => {
  const allGuards = Object.keys(machine.parseResult?.getAllNamedConds() || {});

  const unusedGuards =
    machine.parseResult?.ast?.options?.guards?.properties.filter((guard) => {
      return !allGuards.includes(guard.key);
    });

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
