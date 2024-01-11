import { MachineExtractResult } from '@xstate/machine-extractor';
import { TypegenData } from '@xstate/tools-shared';

export interface ExtractionResult {
  machineResult: MachineExtractResult;
  configError?: string;
  types?: TypegenData | undefined;
}

export interface CachedDocument {
  documentText: string;
  extractionResults: ExtractionResult[];
  error?: { type: 'syntax' | 'unknown'; message: string } | undefined;
  undoStack: Array<{ deleted: any[] } | undefined>;
  v5: boolean;
}
