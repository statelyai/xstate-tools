import { interpret } from 'xstate';
import { createLiveMachine } from '../../createLiveMachineHelper';
import { fetchedMachine } from './monsterMachine.fetched';

const machineVersionId = 'cf092ad2-5172-4f52-8ec8-7943bfe8b189';
const toggleMachine = createLiveMachine({ machineVersionId }, fetchedMachine);

const actor = interpret(toggleMachine).start();
actor.send({ type: 'hungry' });
