import { actorFromStately } from '@statelyai/sky';

// TODO: The Sky SDK is using xstate v5 so we can't really create meaningful test until we upgrade to v5 in this repo
async function testActor() {
  const actor = await actorFromStately({
    url: 'https://sky.dev.stately.ai/th413d',
    sessionId: 'my session',
  });
  actor.send({ type: 'INSERT_COINS' });
}
