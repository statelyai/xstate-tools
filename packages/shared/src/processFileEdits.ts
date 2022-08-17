export type FileEdit = {
  start: number;
  end: number;
  newText: string;
};

export const processFileEdits = (
  oldText: string,
  fileEdits: FileEdit[],
): string => {
  const fileEditsSortedByStart = [...fileEdits].sort(
    (a, b) => b.start - a.start,
  );

  let newText = oldText;

  for (const fileEdit of fileEditsSortedByStart) {
    newText =
      newText.substr(0, fileEdit.start) +
      fileEdit.newText +
      newText.substr(fileEdit.end);
  }

  return newText;
};
