export const getRawTextFromNode = (
  text: string,
  node: { start: number | null; end: number | null },
): string => {
  return text.slice(node.start!, node.end!);
};
