import { processFileEdits } from '..';

describe('processFileEdits', () => {
  it.each([
    [
      `Hello, everyone!`,
      [
        {
          range: [
            { line: 0, column: 0, index: 0 },
            { line: 0, column: 0, index: 0 },
          ] as const,
          newText: 'Great, ',
        },
      ],
      `Great, Hello, everyone!`,
    ],
    [
      `{}, {}`,
      [
        {
          range: [
            { line: 0, column: 0, index: 0 },
            { line: 0, column: 2, index: 2 },
          ] as const,
          newText: `{} as {}`,
        },
        {
          range: [
            { line: 0, column: 4, index: 4 },
            { line: 0, column: 6, index: 6 },
          ] as const,
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
