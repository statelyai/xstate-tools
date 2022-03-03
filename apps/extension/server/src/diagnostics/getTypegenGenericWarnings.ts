import { DiagnosticSeverity } from "vscode-languageserver";
import { getRangeFromSourceLocation } from "@xstate/tools-shared";
import { DiagnosticGetter } from "../getDiagnostics";

export const getTypegenGenericWarnings: DiagnosticGetter = (machine) => {
  const typeArguments = machine?.parseResult?.ast?.typeArguments?.node;

  if (machine.parseResult?.ast.definition?.tsTypes && typeArguments) {
    return [
      {
        message: `Generics cannot be specified using type parameters when using typegen. Use the schema property of the machine config instead.`,
        range: getRangeFromSourceLocation(typeArguments.loc!),
        severity: DiagnosticSeverity.Error,
      },
    ];
  }

  return [];
};
