import { getRangeFromSourceLocation } from '@xstate/tools-shared';
import { DiagnosticSeverity } from 'vscode-languageserver';
import { DiagnosticGetter } from '../getDiagnostics';

export const getMetaWarnings: DiagnosticGetter = (
  machine,
  textDocument,
  settings,
) => {
  /**
   * If the user has said don't show warnings,
   * don't show warnings for meta
   */
  if (!settings.showVisualEditorWarnings) return [];

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
