import { DiagnosticSeverity } from "vscode-languageserver";
import { DiagnosticGetter } from "../getDiagnostics";
import {
  getRangeFromSourceLocation,
  getSetOfNames,
} from "@xstate/tools-shared";

export const getUnusedGuardsImplementations: DiagnosticGetter = (
  machine,
  textDocument,
) => {
  const allGuards = getSetOfNames(
    machine.parseResult?.getAllConds(["named"]) || [],
  );

  const unusedGuards =
    machine.parseResult?.ast?.options?.guards?.properties.filter((guard) => {
      return !allGuards.has(guard.key);
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
