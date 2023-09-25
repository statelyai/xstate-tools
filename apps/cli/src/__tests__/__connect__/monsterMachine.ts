import { fetchFromStately } from '@xstate/machine-extractor';
import { interpret } from 'xstate';
import { skyConfig } from './monsterMachine.sky';

// Scenario 1: Create a machine from the Studio
const machine = fetchFromStately(
  {
    url: 'https://sky.dev.stately.ai/th413d',
    xstateVersion: '4',
  },
  skyConfig,
);

// const machine2 = createLiveActor({ machineVersionId });

// // Scenario 2: Create a live actor from the Studio which is running on Stately Sky
// const liveActor = createLiveActor(
//   { machineVersionId, sessionId },
//   fetchedMachine,
// );

const actor = interpret(machine).start();
actor.send({ type: 'INSERT_COINS' });

// //
// const { isReady, ...snapshot } = actor.getSnapshot();

// interface LiveActor extends AnyActorRef<T> {
//   isReady: boolean;
// }
// interface LiveActorSnapshot extends Snapshot<T> {
//   isReady: boolean;
// }
