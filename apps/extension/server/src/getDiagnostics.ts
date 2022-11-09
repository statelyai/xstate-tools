import { MachineExtractResult } from '@xstate/machine-extractor';
import { GlobalSettings } from '@xstate/tools-shared';
import { Diagnostic } from 'vscode-languageserver';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { getMetaWarnings } from './diagnostics/getMetaWarnings';
import { getTypegenGenericWarnings } from './diagnostics/getTypegenGenericWarnings';
import { getUnusedActionImplementations } from './diagnostics/getUnusedActionImplementations';
import { getUnusedGuardsImplementations } from './diagnostics/getUnusedGuardImplementations';
import { getUnusedServicesImplementations } from './diagnostics/getUnusedServicesImplementations';
import { miscDiagnostics } from './diagnostics/misc';

export type DiagnosticGetter = (
  machineResult: MachineExtractResult,
  textDocument: TextDocument,
  settings: GlobalSettings,
) => Diagnostic[];

const getters: DiagnosticGetter[] = [
  miscDiagnostics,
  getUnusedActionImplementations,
  getUnusedServicesImplementations,
  getUnusedGuardsImplementations,
  getMetaWarnings,
  getTypegenGenericWarnings,
];

export const getDiagnostics = (
  machineResults: MachineExtractResult[],
  textDocument: TextDocument,
  settings: GlobalSettings,
): Diagnostic[] => {
  return machineResults.flatMap((machineResult) =>
    getters.flatMap((getter) => getter(machineResult, textDocument, settings)),
  );
};
