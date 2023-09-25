import { actorFromStately } from '@xstate/tools-shared';

const actor = actorFromStately({
  url: 'https://sky.dev.stately.ai/th413d',
  xstateVersion: '5',
}).start();

actor.send({ type: 'INSERT_COINS' });
