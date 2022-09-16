import { MachineParseResult } from '@xstate/machine-extractor';
import { TypegenData } from '@xstate/tools-shared';

export interface CachedDocument {
  documentText: string;
  machineResults: MachineParseResult[];
  types: TypegenData[];
}
