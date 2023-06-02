export const getRawTextFromNode = (
  text: string,
  node: { start?: number | null | undefined; end?: number | null | undefined },
): string => {
  return text.slice(node.start!, node.end!);
};
