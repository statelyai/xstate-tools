import { DiagnosticSeverity } from "vscode-languageserver";
import {
  getInlineImplementations,
  getRangeFromSourceLocation,
} from "xstate-vscode-shared";
import { DiagnosticGetter } from "../getDiagnostics";

export const getInlineImplementationsWarnings: DiagnosticGetter = (machine) => {
  return getInlineImplementations(machine.parseResult).map((node) => {
    return {
      message: `Inline implementations cannot be used with the visual editor`,
      range: getRangeFromSourceLocation(node.node.loc!),
      severity: DiagnosticSeverity.Warning,
    };
  });
};
