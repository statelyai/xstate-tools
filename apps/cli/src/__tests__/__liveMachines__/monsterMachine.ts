import { fetchFromStately } from '@xstate/machine-extractor';
import { interpret } from 'xstate';

const apiKey = import.meta.env.VITE_SKY_API_KEY as string;

const skyUrl = 'https://sky.dev.stately.ai/njmprd';
const expanded =
  'https://dev.stately.ai/registry/editor/8868f598-5567-478f-9beb-c559ba5bbfce?machineId=95013cc0-f7a7-4ec4-8d8c-79ea8fee7642&version=28125c1f-bebe-4da3-aadf-f5aca6081d34';
const url = '5175233c-b197-4ed1-ac8d-3fe63a87c856';

// Scenario 1: Create a machine from the Studio
const machine = fetchFromStately({ url });

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
