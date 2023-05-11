const machine = await import(
  './__tests__/__liveMachines__/toggleMachine.fetched'
);

export const createLiveMachine = ({ id }: { id: string }) => {
  console.log(id);
  return machine.default;
};
