import { createLiveMachine } from '../../createLiveMachineHelper';

// TODO: add this automatically like we do with tsTypes: {}
import { fetchedMachine } from './toggleMachine.fetched';

const toggleMachine = createLiveMachine(
  { machineVersionId: '3e4df75b-be6e-4e03-97e1-9ef8b379ccbb' },
  // TODO: add this automatically like we do with tsTypes: {}
  fetchedMachine,
);
