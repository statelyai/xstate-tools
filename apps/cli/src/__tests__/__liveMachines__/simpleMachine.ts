import { createMachine } from 'xstate';
const simpleMachine = createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5SwJYFsAOAbMA6FEOAxAKIBuYAdgC4AEAjANoAMAuoqBgParUpeUOIAB6J6AJgCcuAKwAaEAE9EM3PQAc9GRpkyALADZ1AdhkBfCwspcIcIakw4h3Xv0FIRiALQGFyhF7q4rgAzBp6mnp6MmHi5mYKDth4BE4eLih8AkKiCHrifoiassylepIhzCH66tGWIEk4uJRgAO60sNQAhtRgDM48mW45YoZqBsbG4obMFaaFCAaqGlo6+kamFhZAA */
  id: 'simple',
  tsTypes: {} as import('./simpleMachine.typegen').Typegen0,
  schema: {
    context: {} as { simple: boolean },
    events: {} as { type: 'toggle' },
  },
  context: {
    simple: true,
  },
  initial: 'idle',
  states: {
    idle: {
      on: {
        'Event 1': 'new state 1',
      },
    },

    'new state 1': {},
  },
});
