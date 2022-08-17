import { processFileEdits } from '..';

describe('processFileEdits', () => {
  it.each([
    [
      `Hello, everyone!`,
      [{ start: 0, end: 0, newText: 'Great, ' }],
      `Great, Hello, everyone!`,
    ],
    [
      `{}, {}`,
      [
        { start: 0, end: 2, newText: `{} as {}` },
        {
          start: 4,
          end: 6,
          newText: `{} as {}`,
        },
      ],
      `{} as {}, {} as {}`,
    ],
  ])(
    `%p should be transformed by %o into %p`,
    (initialText, fileEdits, expectedText) => {
      expect(processFileEdits(initialText, fileEdits)).toEqual(expectedText);
    },
  );
});
