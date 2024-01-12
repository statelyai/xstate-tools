export interface ExtractionContext {
  errors: ExtractionError[];
  digraph: Pick<ExtractorDigraphDef, 'nodes' | 'edges'>;
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

export type ExtractorNodeDef = {
  type: 'node';
  uniqueId: string;
  parentId: string | undefined;
  data: {
    // key: string;
    type: 'normal' | 'parallel' | 'final' | 'history' | undefined;
    history: 'shallow' | 'deep' | undefined;
    metaEntries: ExtractorMetaEntry[];
    entry: string[];
    exit: string[];
    invoke: string[];
    initial: string | undefined;
    tags: string[];
    description: string | undefined;
  };
};

type ExtractorMetaEntry = [string, unknown];

export type ExtractorDigraphDef = {
  root: string;
  nodes: Record<string, ExtractorNodeDef>;
  edges: Record<string, never>;
};
