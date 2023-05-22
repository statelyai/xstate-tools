import { createLiveMachine } from '../../createLiveMachineHelper';

const apiKey = import.meta.env.VITE_SKY_API_KEY as string;

const machineVersionId = '3e4df75b-be6e-4e03-97e1-9ef8b379ccbb';

// Scenario 1: Create a machine from the Studio
const machine = createLiveMachine({ machineVersionId });
// const machine2 = createLiveActor({ machineVersionId });

// // Scenario 2: Create a live actor from the Studio which is running on Stately Sky
// const liveActor = createLiveActor(
//   { machineVersionId, sessionId },
//   fetchedMachine,
// );

// const actor = interpret(machine).start();
// actor.send({ type: 'toggle' });

// //
// const { isReady, ...snapshot } = actor.getSnapshot();

// interface LiveActor extends AnyActorRef<T> {
//   isReady: boolean;
// }
// interface LiveActorSnapshot extends Snapshot<T> {
//   isReady: boolean;
// }
