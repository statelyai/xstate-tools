import { DiagnosticSeverity } from "vscode-languageserver";
import { DiagnosticGetter } from "../getDiagnostics";
import { getRangeFromSourceLocation } from "../getRangeFromSourceLocation";

// TODO - add checker for conds and services
export const getUnusedActionImplementations: DiagnosticGetter = (
  machine,
  textDocument,
) => {
  const allActions = Object.keys(
    machine.parseResult?.getAllNamedActions() || {},
  );

  const unusedActions =
    machine.parseResult?.ast?.options?.actions?.properties.filter((action) => {
      return !allActions.includes(action.key);
    });

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
