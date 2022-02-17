import * as vscode from "vscode";
import { parseMachinesFromFile } from "xstate-parser-demo";
import { getRangeFromSourceLocation } from "xstate-vscode-shared";

export const initiateLayoutStringDecoration = (
  context: vscode.ExtensionContext,
) => {
  const HideTextDecoration = vscode.window.createTextEditorDecorationType({
    rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed,
    textDecoration: "none; display: none;", // a hack to inject custom style
  });

  const handleDecorators = (editor: vscode.TextEditor) => {
    editor.setDecorations(HideTextDecoration, []);
    const result = parseMachinesFromFile(editor.document.getText());

    const ranges: vscode.DecorationOptions[] = [];

    result.machines.forEach((machine) => {
      const layoutElement = machine.getLayoutComment();

      if (layoutElement?.comment) {
        const range = getRangeFromSourceLocation(
          layoutElement?.comment.node.loc!,
        );
        ranges.push({
          range: new vscode.Range(
            new vscode.Position(range.start.line, range.start.character),
            new vscode.Position(range.end.line, range.end.character),
          ),
          renderOptions: {
            before: {
              contentText: `/** xstate-layout comment */`,
            },
          },
          hoverMessage: new vscode.MarkdownString(`XState Layout comment`),
        });
      }
    });

    editor.setDecorations(HideTextDecoration, ranges);
  };

  vscode.window.onDidChangeActiveTextEditor(
    (e) => {
      handleDecorators(e);
    },
    null,
    context.subscriptions,
  );

  vscode.workspace.onDidChangeTextDocument(
    (event) => {
      vscode.window.visibleTextEditors.forEach((editor) => {
        handleDecorators(editor);
      });
    },
    null,
    context.subscriptions,
  );

  vscode.window.onDidChangeVisibleTextEditors(
    (editors) => {
      handleDecorators(editors[0]);
    },
    null,
    context.subscriptions,
  );

  vscode.window.onDidChangeTextEditorSelection((e) => {
    handleDecorators(e.textEditor);
  });

  handleDecorators(vscode.window.activeTextEditor);
};
