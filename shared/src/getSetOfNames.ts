export const getSetOfNames = <T extends { name: string }>(
  arr: T[],
): Set<string> => {
  const set = new Set<string>();

  arr.forEach((elem) => set.add(elem.name));

  return set;
};
