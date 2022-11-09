import { MachineExtractResult } from '@xstate/machine-extractor';
import { TypegenData } from '@xstate/tools-shared';

export interface CachedDocument {
  documentText: string;
  machineResults: (MachineExtractResult | undefined)[];
  types: TypegenData[];
}
