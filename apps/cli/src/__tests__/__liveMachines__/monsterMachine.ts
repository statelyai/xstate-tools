import { createLiveMachine } from '@xstate/machine-extractor';
import { interpret } from 'xstate';
import { fetchedConfig } from './monsterMachine.fetched';

const apiKey = import.meta.env.VITE_SKY_API_KEY as string;

const machineVersionId = '5175233c-b197-4ed1-ac8d-3fe63a87c856';

// Scenario 1: Create a machine from the Studio
const machine = createLiveMachine({ machineVersionId }, fetchedConfig);

// const machine2 = createLiveActor({ machineVersionId });

// // Scenario 2: Create a live actor from the Studio which is running on Stately Sky
// const liveActor = createLiveActor(
//   { machineVersionId, sessionId },
//   fetchedMachine,
// );

const actor = interpret(machine).start();
actor.send({ type: 'toggle' });

// //
// const { isReady, ...snapshot } = actor.getSnapshot();

// interface LiveActor extends AnyActorRef<T> {
//   isReady: boolean;
// }
// interface LiveActorSnapshot extends Snapshot<T> {
//   isReady: boolean;
// }
