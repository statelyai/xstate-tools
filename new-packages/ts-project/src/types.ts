import type { SourceFile } from 'typescript';

export interface ExtractionContext {
  errors: ExtractionError[];
}

// TODO: add error location/span
export type ExtractionError =
  | {
      type: 'state_unhandled';
      node: unknown;
    }
  | {
      type: 'state_property_unhandled';
      node: unknown;
    }
  | {
      type: 'property_key_no_roundtrip';
      node: unknown;
    }
  | {
      type: 'property_key_unhandled';
      propertyKind: 'computed' | 'private';
      node: unknown;
    };

export type ExtractorStateConfig = {
  id: string;
  //   uniqueId: string; // disabling this for now because it breaks snapshots every time tests run
  data: {
    // key: string;
    type: 'parallel' | 'final' | 'history' | undefined;
    history: 'shallow' | 'deep' | undefined;
    metaEntries: ExtractorMetaEntry[];
    entry: ExtractorAction[];
    exit: ExtractorAction[];
    invoke: ExtractorInvoke[];
    initial: string | undefined;
    tags: string[];
    description: string | undefined;
  };
  states: ExtractorStateConfig[];
};

type ExtractorMetaEntry = [string, unknown];
type ExtractorAction = never | never[];
type ExtractorInvoke = never | never[];
