import { DiagnosticSeverity } from "vscode-languageserver";
import { DiagnosticGetter } from "../getDiagnostics";
import { getRangeFromSourceLocation } from "xstate-tools-shared";

export const getMetaWarnings: DiagnosticGetter = (machine, textDocument) => {
  const allMetaNodes =
    machine.parseResult?.getAllStateNodes().flatMap((node) => {
      if (!node.ast.meta) {
        return [];
      }
      return node.ast.meta;
    }) || [];

  return allMetaNodes.map((elem) => {
    return {
      message: `The meta property cannot currently be used with the visual editor.`,
      range: getRangeFromSourceLocation(elem.node.loc!),
      severity: DiagnosticSeverity.Warning,
    };
  });
};
