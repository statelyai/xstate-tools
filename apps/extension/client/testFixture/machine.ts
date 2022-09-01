import { createMachine } from 'xstate';

/** @xstate-layout N4IgpgJg5mDOIC5gF8A0IB2B7CdGgAoBbAQwGMALASwzAEoA6KiAGzHxAActYqAXKlgwcAHogC0AZgBsDAOwBGaQE5lcyQoCsABkmaAHOgCeiSZP0NlkgEybJyhdocKALLuRoQxctVp0O3LwCQqIS0trySqrqWroGxojW0rJWttpyytaKLnIuHh5AA */
createMachine({
  id: '(machine)',
  initial: 'idle',
  states: {
    idle: {},
  },
});

createMachine({
  id: '(machine)2',
  initial: 'elo',
  states: {
    elo: {},
  },
});
