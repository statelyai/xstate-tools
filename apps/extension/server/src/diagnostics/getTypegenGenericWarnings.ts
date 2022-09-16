import { getRangeFromSourceLocation } from '@xstate/tools-shared';
import { DiagnosticSeverity } from 'vscode-languageserver';
import { DiagnosticGetter } from '../getDiagnostics';

export const getTypegenGenericWarnings: DiagnosticGetter = (machineResult) => {
  const typeArguments = machineResult.ast?.typeArguments?.node;

  if (machineResult.ast.definition?.tsTypes && typeArguments) {
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
