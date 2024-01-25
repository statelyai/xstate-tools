import { machineFromStately } from '@statelyai/sky';
import { createActor } from 'xstate5';
import { skyConfig } from './machineFromStately.sky';

// TODO: The Sky SDK is using xstate v5 so we can't really create meaningful test until we upgrade to v5 in this repo
const machine = machineFromStately(
  { url: 'https://sky.dev.stately.ai/th413d' },
  skyConfig as any,
);

const actor = createActor(machine as any).start();
actor.send({ type: 'INSERT_COINS' });
