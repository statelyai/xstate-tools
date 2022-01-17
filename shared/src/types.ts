import { MachineConfig } from "xstate";

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

export interface XStateUpdateEvent {
  uri: string;
  machines: {
    definitionLoc?: SourceLocation | null;
    config: MachineConfig<any, any, any>;
    typeNodeLoc?: SourceLocation | null;
    index: number;
    guardsToMock: string[];
    actionsInOptions: string[];
    guardsInOptions: string[];
    servicesInOptions: string[];
    allServices: string[];
    delaysInOptions: string[];
    tags: string[];
    hasTypesNode: boolean;
  }[];
}
