import { MachineExtractResult } from '@xstate/machine-extractor';
import { TypegenData } from '@xstate/tools-shared';

export interface ExtractionResult {
  machineResult: MachineExtractResult;
  configError?: string;
  types?: TypegenData;
}

export interface CachedDocument {
  documentText: string;
  extractionResults: ExtractionResult[];
}
