import { getDocumentValidationsResults } from "@xstate/tools-shared";
import * as vscode from "vscode";
import { documentationLinks, getDocumentationLink } from "./documentationLinks";

const languages = [
  "typescript",
  "typescriptreact",
  "javascript",
  "javascriptreact",
];

export const initiateDocsHelper = (context: vscode.ExtensionContext) => {
  const hoverProvider: vscode.HoverProvider = {
    provideHover: (document, position) => {
      // Get the word the user is hovering over
      const hoveredWordRange = document.getWordRangeAtPosition(position);
      const hoveredWord = document.getText(hoveredWordRange);

      // Get the machines from the document and map the ranges inside the document covered by the machines
      const machines = getDocumentValidationsResults(document.getText()).map(
        (machine) => ({
          machine,
          range: new vscode.Range(
            document.positionAt(machine.parseResult.ast.node.start),
            document.positionAt(machine.parseResult.ast.node.end)
          ),
        })
      );

      // Check if the word the user is hovering is inside a machine
      const machineCoveringWord = machines.find((machine) =>
        machine.range.contains(hoveredWordRange)
      );

      const hoveredWordInsideMachine = machineCoveringWord !== undefined;

      if (!hoveredWordInsideMachine) return;

      const schemaKeywords = documentationLinks
        .filter((docLink) =>
          docLink.keyWords.some((keyWord) => keyWord.startsWith("schema."))
        )
        .flatMap((docLink) =>
          docLink.keyWords.map((keyWord) => keyWord.replace("schema.", ""))
        );

      // If the word is a schema keyword, show the schema documentation if it exists
      if (schemaKeywords.includes(hoveredWord)) {
        const machine = machineCoveringWord.machine;
        const schema = machine.parseResult.ast.definition.schema;

        // If the schema contains the keyword and covers the word, show the documentation
        if (
          schema[hoveredWord] &&
          new vscode.Range(
            document.positionAt(schema._valueNode.start),
            document.positionAt(schema._valueNode.end)
          ).contains(hoveredWordRange)
        ) {
          return {
            contents: getDocsLink(`schema.${hoveredWord}`),
          };
        }
      } else {
        return {
          contents: getDocsLink(hoveredWord),
        };
      }
    },
  };

  context.subscriptions.push(
    ...languages.map((language) => {
      return vscode.languages.registerHoverProvider(
        {
          language,
        },
        hoverProvider
      );
    })
  );
};

const getDocsLink = (word: string): vscode.MarkdownString[] => {
  const markdownStrings: vscode.MarkdownString[] = [];

  const link = getDocumentationLink(word);
  if (link) {
    markdownStrings.push(
      new vscode.MarkdownString(
        `[Read about ${link.description}](${link.link}) in the XState beta docs`
      )
    );
  }
  return markdownStrings;
};
