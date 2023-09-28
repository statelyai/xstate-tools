import { machineFromStately } from '@statelyai/sky';
import { interpret } from 'xstate';
import { skyConfig } from './machineFromStately.sky';

// TODO: The Sky SDK is using xstate v5 so not everything is typed correctly
const machine = machineFromStately(
  { url: 'https://sky.dev.stately.ai/th413d' },
  skyConfig,
);
const actor = interpret(machine).start();
actor.send({ type: 'INSERT_COINS' });
