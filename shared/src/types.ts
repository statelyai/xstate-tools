import { MachineConfig, StateMachine } from "xstate";
import { MachineParseResult } from "xstate-parser-demo/lib/MachineParseResult";
import { IntrospectMachineResult } from ".";

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
    allServices: { src: string; id: string | undefined }[];
    delaysInOptions: string[];
    tags: string[];
    hasTypesNode: boolean;
  }[];
}

export type DocumentValidationsResult = {
  machine?: StateMachine<any, any, any>;
  parseResult?: MachineParseResult;
  introspectionResult?: IntrospectMachineResult;
  documentText: string;
};
