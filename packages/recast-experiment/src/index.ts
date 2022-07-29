import { parseSync } from "@babel/core";
import { ParseResult, traverseParseResult } from "@xstate/machine-extractor";
import * as recast from "recast";

export const transformFile = (
  src: string,
  mutate: (result: ParseResult) => void
): string => {
  const ast = recast.parse(src, {
    parser: {
      parse: (source: string) =>
        parseSync(source, {
          plugins: [
            `@babel/plugin-syntax-jsx`,
            `@babel/plugin-proposal-class-properties`,
          ],
          overrides: [
            {
              test: [`**/*.ts`, `**/*.tsx`],
              plugins: [[`@babel/plugin-syntax-typescript`, { isTSX: true }]],
            },
          ],
          filename: "file.ts",
          parserOpts: {
            tokens: true, // recast uses this
          },
        }),
    },
  });

  const parseResult = traverseParseResult(ast, src);

  mutate(parseResult);

  return recast.print(ast).code;
};
