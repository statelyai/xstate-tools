import { RecordOfArrays } from './RecordOfArrays';

export const groupByUniqueName = <T extends { name: string }>(
  arr: T[],
): Record<string, T[]> => {
  const record = new RecordOfArrays<T>();

  arr.forEach((elem) => {
    record.add(elem.name, elem);
  });

  return record.toObject();
};
