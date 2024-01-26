import type { SourceFile } from 'typescript';

// it's acting as a threshold - atm there is no need to know the exact version
// strings are used to allow for future minor versions
export type XStateVersion = '4' | '5';

export interface TreeNode {
  uniqueId: string;
  parentId: string | undefined;
  children: Record<string, TreeNode>;
}

export interface ExtractionContext {
  sourceFile: SourceFile;
  xstateVersion: XStateVersion;
  errors: ExtractionError[];
  digraph: Pick<
    ExtractorDigraphDef,
    'blocks' | 'nodes' | 'edges' | 'implementations' | 'data'
  >;
  treeNodes: Record<string, TreeNode>;
  idMap: Record<string, string>;
  originalTargets: Record<string, string[]>;
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
      type: 'state_property_invalid';
    }
  | {
      type: 'state_type_invalid';
    }
  | {
      type: 'state_history_invalid';
    }
  | {
      type: 'transition_property_unhandled';
    }
  | {
      type: 'transition_target_unresolved';
    }
  | {
      type: 'property_key_no_roundtrip';
    }
  | {
      type: 'property_key_unhandled';
      propertyKind: 'computed' | 'private';
    }
  | {
      type: 'property_unhandled';
    }
  | {
      type: 'property_mixed';
    }
  | {
      type: 'action_unhandled';
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
  properties: {
    src: string;
    id: string;
  };
}

export interface GuardBlock extends BlockBase {
  blockType: 'guard';
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

interface NamedEventTypeData {
  type: 'named';
  eventType: string;
}

type InvocationEventTypeData =
  | {
      type: 'invocation.done';
      invocationId: string;
    }
  | {
      type: 'invocation.error';
      invocationId: string;
    };

export type EventTypeData =
  | {
      type: 'after';
      delay: string;
    }
  | NamedEventTypeData
  | InvocationEventTypeData
  | {
      type: 'state.done';
    }
  | {
      type: 'always';
    }
  | {
      type: 'wildcard';
    }
  | { type: 'init' };

export type Edge = {
  type: 'edge';
  uniqueId: string;
  source: string;
  targets: string[];
  data: {
    eventTypeData: EventTypeData;
    actions: string[];
    guard: string | undefined;
    description: string | undefined;
    metaEntries: ExtractorMetaEntry[];
    internal: boolean;
  };
};

export type ExtractorMetaEntry = [string, unknown];

export type ExtractorDigraphDef = {
  root: string;
  blocks: Record<string, Block>;
  nodes: Record<string, Node>;
  edges: Record<string, Edge>;
  implementations: {
    actions: Record<string, { type: 'action'; id: string; name: string }>;
    actors: Record<string, { type: 'actor'; id: string; name: string }>;
    guards: Record<string, { type: 'guard'; id: string; name: string }>;
  };
  data: {
    context: JsonObject | `{{${string}}}`;
  };
};

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonObject
  | JsonValue[];
export type JsonObject = { [key: string]: JsonValue };
