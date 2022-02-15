import * as prettier from "prettier";
import * as vscode from "vscode";
import { parseMachinesFromFile } from "xstate-parser-demo";
import {
  getRangeFromSourceLocation,
  getRawTextFromNode,
  resolveUriToFilePrefix,
} from "xstate-vscode-shared";
import { UpdateDefinitionEvent } from "./editorWebviewScript";

const prettierStartRegex = /^([^{]){1,}/;
const prettierEndRegex = /([^}]){1,}$/;
const UNWRAP_START = `@UNWRAP_START@`;
const UNWRAP_END = `@UNWRAP_END@`;
const markAsUnwrap = (str: string) => {
  return `${UNWRAP_START}${str}${UNWRAP_END}`;
};

const UNWRAPPER_REGEX = /"@UNWRAP_START@(.{1,})@UNWRAP_END@"/g;

const STATE_KEYS_TO_PRESERVE = [
  "context",
  "tsTypes",
  "schema",
  "meta",
  "data",
  "delimiter",
  "preserveActionOrder",
] as const;

export const handleDefinitionUpdate = async (event: UpdateDefinitionEvent) => {
  const doc = vscode.workspace.textDocuments.find((doc) => {
    return resolveUriToFilePrefix(doc.uri.path) === event.uri;
  });

  const text = doc.getText();

  const result = parseMachinesFromFile(text);

  const machine = result.machines[event.index];

  if (!machine) return;

  const workspaceEdit = new vscode.WorkspaceEdit();

  const range = getRangeFromSourceLocation(machine.ast.definition?.node?.loc);

  const nodesToPreserve: string[] = STATE_KEYS_TO_PRESERVE.map((nodeKey) => {
    return machine.ast.definition?.[nodeKey]?.node
      ? `\n${nodeKey}: ${getRawTextFromNode(
          text,
          machine.ast.definition?.[nodeKey]?.node,
        ).replace("\n", " ")},`
      : "";
  });

  const json = JSON.stringify(
    event.config,
    (key, value) => {
      if (
        key === "cond" &&
        event.implementations?.implementations?.guards?.[value]
          ?.jsImplementation
      ) {
        return markAsUnwrap(
          event.implementations?.implementations?.guards?.[value]
            ?.jsImplementation,
        );
      }
      if (
        key === "src" &&
        event.implementations?.implementations?.services?.[value]
          ?.jsImplementation
      ) {
        return markAsUnwrap(
          event.implementations?.implementations?.services?.[value]
            ?.jsImplementation,
        );
      }

      if (["actions", "entry", "exit"].includes(key)) {
        if (Array.isArray(value)) {
          return value.map((action) => {
            if (
              event.implementations?.implementations?.actions?.[action]
                ?.jsImplementation
            ) {
              return markAsUnwrap(
                event.implementations?.implementations?.actions?.[action]
                  ?.jsImplementation,
              );
            }
            return action;
          });
        }
        if (
          event.implementations?.implementations?.actions?.[value]
            ?.jsImplementation
        ) {
          return markAsUnwrap(
            event.implementations?.implementations?.actions?.[value]
              ?.jsImplementation,
          );
        }
      }

      return value;
    },
    2,
  );

  const prettierConfig = await prettier.resolveConfig(doc.fileName);

  let finalTextToInput = `${json.slice(0, 1)}${nodesToPreserve.join(
    "",
  )}${json.slice(1)}`.replace(UNWRAPPER_REGEX, (str) => {
    // +1 and -1 for the quotes
    return str
      .slice(UNWRAP_START.length + 1, -UNWRAP_END.length - 1)
      .replace(/\\n/g, "\n")
      .replace(/\\"/g, '"')
      .replace(/\\t/g, "\t");
  });

  try {
    const result = await prettier.format(`(${finalTextToInput})`, {
      ...prettierConfig,
      parser: "typescript",
    });

    finalTextToInput = result
      .replace(prettierStartRegex, "")
      .replace(prettierEndRegex, "");
  } catch (e) {
    console.log(e);
  }

  workspaceEdit.replace(
    doc.uri,
    new vscode.Range(
      new vscode.Position(range.start.line, range.start.character),
      new vscode.Position(range.end.line, range.end.character),
    ),
    finalTextToInput,
  );

  const layoutComment = machine.getLayoutComment()?.comment;

  if (layoutComment) {
    // replace layout comment content
    const range = getRangeFromSourceLocation(layoutComment.node.loc);

    workspaceEdit.replace(
      doc.uri,
      new vscode.Range(
        new vscode.Position(range.start.line, range.start.character),
        new vscode.Position(range.end.line, range.end.character),
      ),
      `/** @xstate-layout ${event.layoutString} */`,
    );
  } else {
    // Insert layout comment
    const range = getRangeFromSourceLocation(machine.ast.callee.loc);

    workspaceEdit.insert(
      doc.uri,
      new vscode.Position(range.start.line, range.start.character),
      `\n/** @xstate-layout ${event.layoutString} */\n`,
    );
  }

  await vscode.workspace.applyEdit(workspaceEdit);
};
