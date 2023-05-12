import { createLiveMachine } from '../../createLiveMachineHelper';

// TODO: add this automatically like we do with tsTypes: {}
import { fetchedMachine } from './toggleMachine.fetched';

const toggleMachine = createLiveMachine({
  machineVersionId: '3e4df75b-be6e-4e03-97e1-9ef8b379ccbb',
  apiKey: 'sta_fcdd441a-ae25-49d0-8f8f-2de3f6bf776a',

  // TODO: add this automatically like we do with tsTypes: {}
  fetchedMachine,
});
