import { actorFromStately } from '@statelyai/sky';

// TODO: The Sky SDK is using xstate v5 so not everything is typed correctly
async function testActor() {
  const actor = await actorFromStately({
    url: 'https://sky.dev.stately.ai/th413d',
  });
  actor.send({ type: 'INSERT_COINS' });
}
