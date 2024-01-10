import { ExtractorMachineConfig, MachineEdit } from '@xstate/machine-extractor';
import { MachineConfig } from 'xstate';
import { TypegenData } from './getTypegenData';

export interface TypegenOptions {
  useDeclarationFileForTypegenData: boolean;
}

export interface GlobalSettings extends TypegenOptions {
  showVisualEditorWarnings: boolean;
}

export interface SourceLocation {
  start: {
    line: number;
    column: number;
  };
  end: {
    line: number;
    column: number;
  };
}

export interface ImplementationsMetadata {
  guards: Record<
    string,
    {
      jsImplementation?: string;
    }
  >;
  actions: Record<
    string,
    {
      jsImplementation?: string;
    }
  >;
  services: Record<
    string,
    {
      jsImplementation?: string;
    }
  >;
}

export type Position = { line: number; column: number; index: number };
export type Range = readonly [start: Position, end: Position];

export type CursorPosition = { line: number; column: number };

export interface TextEdit {
  type: 'replace';
  range: Range;
  newText: string;
}

export interface FileTextEdit extends TextEdit {
  uri: string;
}

export interface RequestMap {
  getMachineAtIndex: {
    params: { uri: string; machineIndex: number };
    result: {
      config: ExtractorMachineConfig;
      layoutString: string | null;
      implementations: ImplementationsMetadata;
      namedGuards: string[];
      xstateVersion: 4 | 5;
    };
    error: any;
  };
  getMachineAtCursorPosition: {
    params: { uri: string; position: CursorPosition };
    result: {
      config: ExtractorMachineConfig;
      machineIndex: number;
      layoutString: string | null;
      implementations: ImplementationsMetadata;
      namedGuards: string[];
      xstateVersion: 4 | 5;
    };
    error: any;
  };
  applyMachineEdits: {
    params: {
      machineEdits: MachineEdit[];
      options?: { v5?: boolean } | undefined;
      reason?: 'undo' | 'redo' | undefined;
    };
    result: {
      textEdits: FileTextEdit[];
    };
    error: any;
  };
  getTsTypesAndEdits: {
    params: { uri: string };
    result:
      | {
          typegenUri: string;
          types: TypegenData[];
          edits: Array<FileTextEdit>;
        }
      | undefined;
    error: never;
  };
  getNodePosition: {
    params: { path: string[] };
    result: Range | void;
    error: never;
  };
  setDisplayedMachine: {
    params: { uri: string; machineIndex: number };
    result: void;
    error: never;
  };
  clearDisplayedMachine: {
    params: undefined;
    result: void;
    error: never;
  };
}

export interface NotificationMap {
  displayedMachineUpdated: {
    config: ExtractorMachineConfig;
    layoutString: string | null;
    implementations: ImplementationsMetadata;
    namedGuards: string[];
  };
  typesUpdated: {
    typegenUri: string;
    types: TypegenData[];
  };
  extractionError: {
    message: string | null;
  };
}
