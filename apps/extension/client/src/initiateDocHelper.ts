import { getDocumentValidationsResults } from "@xstate/tools-shared";
import * as vscode from "vscode";
import { getDocumentationLink } from "./documentationLinks";

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

      // Get the machines from the document
      const machines = getDocumentValidationsResults(document.getText());

      // Get all the ranges inside the document covered by machines
      const machineRanges = machines.map(
        (machine) =>
          new vscode.Range(
            document.positionAt(machine.parseResult.ast.node.start),
            document.positionAt(machine.parseResult.ast.node.end)
          )
      );

      // Check if the word the user is hovering is inside a machine
      const hoveredWordInsideMachine = machineRanges.some((machineRange) =>
        machineRange.contains(hoveredWordRange)
      );

      if (!hoveredWordInsideMachine) return;

      return {
        contents: getDocsLink(hoveredWord),
      };
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
