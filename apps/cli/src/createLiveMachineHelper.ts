export const createLiveMachine = <T>({
  machineVersionId,
  apiKey,
  fetchedMachine,
}: {
  machineVersionId: string;
  apiKey: string;
  fetchedMachine: T;
}) => {
  return fetchedMachine;
};
