import { Diagnostic } from "vscode-languageserver";
import { TextDocument } from "vscode-languageserver-textdocument";
import { DocumentValidationsResult, GlobalSettings } from "xstate-tools-shared";
import { getInlineImplementationsWarnings } from "./diagnostics/getInlineImplementationsWarnings";
import { getMetaWarnings } from "./diagnostics/getMetaWarnings";
import { getTypegenGenericWarnings } from "./diagnostics/getTypegenGenericWarnings";
import { getUnusedActionImplementations } from "./diagnostics/getUnusedActionImplementations";
import { getUnusedGuardsImplementations } from "./diagnostics/getUnusedGuardImplementations";
import { getUnusedServicesImplementations } from "./diagnostics/getUnusedServicesImplementations";
import { miscDiagnostics } from "./diagnostics/misc";

export type DiagnosticGetter = (
  result: DocumentValidationsResult,
  textDocument: TextDocument,
  settings: GlobalSettings,
) => Diagnostic[];

const getters: DiagnosticGetter[] = [
  miscDiagnostics,
  getUnusedActionImplementations,
  getUnusedServicesImplementations,
  getUnusedGuardsImplementations,
  getInlineImplementationsWarnings,
  getMetaWarnings,
  getTypegenGenericWarnings,
];

export const getDiagnostics = (
  validations: DocumentValidationsResult[],
  textDocument: TextDocument,
  settings: GlobalSettings,
): Diagnostic[] => {
  const diagnostics: Diagnostic[] = [];

  validations.forEach((validation) => {
    getters.forEach((getter) => {
      diagnostics.push(...getter(validation, textDocument, settings));
    });
  });

  return diagnostics;
};
