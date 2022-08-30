import { MachineParseResult } from "@xstate/machine-extractor";
import { MachineConfig, MachineOptions, StateMachine } from "xstate";
import { IntrospectMachineResult } from ".";

export interface GlobalSettings {
  showVisualEditorWarnings: boolean;
  targetEditorBaseUrl: string;
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

export interface XStateUpdateMachine {
  definitionLoc?: SourceLocation | null;
  config: MachineConfig<any, any, any>;
  typeNodeLoc?: SourceLocation | null;
  index: number;
  namedGuards: string[];
  namedActions: string[];
  actionsInOptions: string[];
  guardsInOptions: string[];
  servicesInOptions: string[];
  allServices: { src: string; id: string | undefined }[];
  delaysInOptions: string[];
  tags: string[];
  hasTypesNode: boolean;
  chooseActionsInOptions: MachineOptions<any, any, any>["actions"];
  actionGroupsInOptions: MachineOptions<any, any, any>["actions"];
}

export interface XStateUpdateEvent {
  uri: string;
  machines: XStateUpdateMachine[];
}

export type DocumentValidationsResult = {
  machine?: StateMachine<any, any, any>;
  parseResult?: MachineParseResult;
  introspectionResult?: IntrospectMachineResult;
  documentText: string;
};

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
