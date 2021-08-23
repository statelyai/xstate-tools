import { Diagnostic } from "vscode-languageserver";
import { TextDocument } from "vscode-languageserver-textdocument";
import { DocumentValidationsResult } from "./server";

export type DiagnosticGetter = (
  result: DocumentValidationsResult,
  textDocument: TextDocument,
) => Diagnostic[];

export const getDiagnostics = (
  validations: DocumentValidationsResult[],
  textDocument: TextDocument,
  ...getters: DiagnosticGetter[]
): Diagnostic[] => {
  const diagnostics: Diagnostic[] = [];

  validations.forEach((validation) => {
    getters.forEach((getter) => {
      diagnostics.push(...getter(validation, textDocument));
    });
  });

  return diagnostics;
};
