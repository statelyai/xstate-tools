// This file was automatically generated. Edits will be overwritten

export interface Typegen0 {
  '@@xstate/typegen': true;
  internalEvents: {
    'xstate.init': { type: 'xstate.init' };
  };
  invokeSrcNameMap: {};
  missingImplementations: {
    actions: never;
    services: never;
    guards: never;
    delays: never;
  };
  eventsCausingActions: {
    forwardToWebview: 'EDIT_MACHINE' | 'DISPLAYED_MACHINE_UPDATED';
  };
  eventsCausingServices: {
    onDisplayedMachineUpdatedListener: 'EDIT_MACHINE';
    registerEditAtCursorPositionCommand: 'xstate.init';
    registerEditOnCodeLensClickCommand: 'xstate.init';
    webviewActor: 'EDIT_MACHINE';
  };
  eventsCausingGuards: {};
  eventsCausingDelays: {};
  matchesStates: undefined;
  tags: never;
}
