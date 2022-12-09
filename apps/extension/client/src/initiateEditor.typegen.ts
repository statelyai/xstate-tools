// This file was automatically generated. Edits will be overwritten

export interface Typegen0 {
  '@@xstate/typegen': true;
  internalEvents: {
    'done.invoke.webview': {
      type: 'done.invoke.webview';
      data: unknown;
      __tip: 'See the XState TS docs to learn how to strongly type this.';
    };
    'error.platform.webview': { type: 'error.platform.webview'; data: unknown };
    'xstate.init': { type: 'xstate.init' };
    'xstate.stop': { type: 'xstate.stop' };
  };
  invokeSrcNameMap: {
    onServerNotificationListener: 'done.invoke.(machine).openWebview.editing:invocation[0]';
    registerEditAtCursorPositionCommand: 'done.invoke.(machine):invocation[0]';
    registerEditOnCodeLensClickCommand: 'done.invoke.(machine):invocation[1]';
    webviewActor: 'done.invoke.webview';
  };
  missingImplementations: {
    actions: never;
    delays: never;
    guards: never;
    services: never;
  };
  eventsCausingActions: {
    clearEditedMachine: 'EDIT_MACHINE' | 'WEBVIEW_CLOSED' | 'xstate.stop';
    forwardToWebview:
      | 'DISPLAYED_MACHINE_UPDATED'
      | 'EDIT_MACHINE'
      | 'EXTRACTION_ERROR';
    setEditedMachine: 'EDIT_MACHINE';
  };
  eventsCausingDelays: {};
  eventsCausingGuards: {};
  eventsCausingServices: {
    onServerNotificationListener: 'EDIT_MACHINE';
    registerEditAtCursorPositionCommand: 'xstate.init';
    registerEditOnCodeLensClickCommand: 'xstate.init';
    webviewActor: 'EDIT_MACHINE';
  };
  matchesStates:
    | 'idle'
    | 'openWebview'
    | 'openWebview.editing'
    | { openWebview?: 'editing' };
  tags: never;
}
