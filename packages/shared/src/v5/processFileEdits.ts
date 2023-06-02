import { FileTextEdit } from './types';

export const processFileEdits = (
  oldText: string,
  textEdits: Pick<FileTextEdit, 'range' | 'newText'>[],
): string => {
  const sortedEdits = [...textEdits].sort(
    (a, b) => b.range[0].index - a.range[0].index,
  );

  let newText = oldText;

  for (const edit of sortedEdits) {
    newText =
      newText.slice(0, edit.range[0].index) +
      edit.newText +
      newText.slice(edit.range[1].index);
  }

  return newText;
};
