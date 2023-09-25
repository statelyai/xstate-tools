import { machineFromStately } from '@xstate/tools-shared';
import { interpret } from 'xstate';
import { skyConfig } from './machineFromStately.sky';

const machine = machineFromStately(
  {
    url: 'https://sky.dev.stately.ai/th413d',
    xstateVersion: '4',
  },
  skyConfig,
);
const actor = interpret(machine).start();
actor.send({ type: 'INSERT_COINS' });
