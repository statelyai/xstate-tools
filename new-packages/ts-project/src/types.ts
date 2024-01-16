export interface ExtractionContext {
  errors: ExtractionError[];
  digraph: Pick<
    ExtractorDigraphDef,
    'blocks' | 'nodes' | 'edges' | 'implementations'
  >;
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

interface BlockBase {
  uniqueId: string;
  sourceId: string;
  parentId: string;
}

export interface ActionBlock extends BlockBase {
  blockType: 'action';
  properties: {
    type: string;
    params: {};
  };
}

export interface ActorBlock extends BlockBase {
  blockType: 'actor';
}

export interface GuardBlock extends BlockBase {
  blockType: 'guard';
}

export interface TagBlock extends BlockBase {
  blockType: 'tag';
  sourceId: 'xstate.tag';
  properties: {
    name: string;
  };
}

export type Block = ActionBlock | ActorBlock | GuardBlock | TagBlock;

export type BlockSource = {
  kind: 'named';
};

export type Node = {
  type: 'node';
  uniqueId: string;
  parentId: string | undefined;
  data: {
    // key: string;
    type: 'normal' | 'parallel' | 'final' | 'history';
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

  blocks: Record<string, Block>;
  nodes: Record<string, Node>;
  edges: Record<string, never>;

  implementations: {
    actions: Record<string, { type: 'action'; id: string; name: string }>;
    actors: Record<string, never>;
    guards: Record<string, never>;
  };
};
