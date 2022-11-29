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
    clearEditedMachine: 'xstate.stop';
    forwardToWebview: 'EDIT_MACHINE' | 'DISPLAYED_MACHINE_UPDATED';
    setEditedMachine: 'EDIT_MACHINE';
    trackEditorUsage: 'EDIT_MACHINE';
  };
  eventsCausingServices: {
    onServerNotificationListener: 'EDIT_MACHINE';
    registerEditAtCursorPositionCommand: 'xstate.init';
    registerEditOnCodeLensClickCommand: 'xstate.init';
    webviewActor: 'EDIT_MACHINE';
  };
  eventsCausingGuards: {};
  eventsCausingDelays: {};
  matchesStates: undefined;
  tags: never;
}
