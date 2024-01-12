import type { SourceFile } from 'typescript';

export interface ExtractionContext {
  errors: ExtractionError[];
}

// TODO: add error location/span
export type ExtractionError =
  | {
      type: 'state_unhandled';
    }
  | {
      type: 'state_property_unhandled';
    }
  | {
      type: 'state_type_invalid';
    }
  | {
      type: 'state_history_invalid';
    }
  | {
      type: 'property_key_no_roundtrip';
    }
  | {
      type: 'property_key_unhandled';
      propertyKind: 'computed' | 'private';
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
