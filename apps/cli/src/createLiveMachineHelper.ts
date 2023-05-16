export const createLiveMachine = <T>(
  {
    apiKey,
    machineVersionId,
  }: {
    apiKey?: string;
    machineVersionId: string;
  },
  fetchedMachine: T,
) => {
  return fetchedMachine;
};
