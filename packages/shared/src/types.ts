import { MachineEdit } from '@xstate/machine-extractor';
import { MachineConfig } from 'xstate';
import { TypegenData } from './getTypegenData';

export interface GlobalSettings {
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

export type TextEdit = {
  type: 'replace';
  uri: string;
  range: Range;
  newText: string;
};

export interface RequestMap {
  getMachineAtIndex: {
    params: { uri: string; machineIndex: number };
    result: {
      config: MachineConfig<any, any, any>;
      layoutString: string | undefined;
      implementations: ImplementationsMetadata;
      namedGuards: string[];
    };
    error: any;
  };
  getMachineAtCursorPosition: {
    params: { uri: string; position: CursorPosition };
    result: {
      config: MachineConfig<any, any, any>;
      machineIndex: number;
      layoutString: string | undefined;
      implementations: ImplementationsMetadata;
      namedGuards: string[];
    };
    error: any;
  };
  applyMachineEdits: {
    params: { machineEdits: MachineEdit[] };
    result: {
      textEdits: TextEdit[];
    };
    error: any;
  };
  getTsTypesAndEdits: {
    params: { uri: string };
    result: {
      types: TypegenData[];
      edits: Array<TextEdit>;
    };
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
    config: MachineConfig<any, any, any>;
    layoutString: string | undefined;
    implementations: ImplementationsMetadata;
    namedGuards: string[];
  };
  typesUpdated: {
    uri: string;
    types: TypegenData[];
  };
  extractionError: {
    message: string | undefined;
  };
}
