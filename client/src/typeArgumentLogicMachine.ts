import * as vscode from "vscode";
import { createMachine } from "xstate";
import { MachineParseResult } from "xstate-parser-demo/lib/MachineParseResult";
import { getRangeFromSourceLocation } from "xstate-vscode-shared";
import { choose } from "xstate/lib/actions";

export const typeArgumentLogicMachine = (
  machine: MachineParseResult,
  pushTextEdit: (fileEdit: vscode.TextEdit) => void,
  getRawText: (start: number, end: number) => string,
  relativePath: string,
  machineIndex: number,
) => {
  const typeArguments = machine?.ast?.typeArguments?.node;
  const typeArgumentsRaw: string[] =
    typeArguments?.params?.map((param) => {
      return getRawText(param.start, param.end);
    }) || [];

  const calleeRaw = getRawText(
    machine.ast?.callee?.start,
    machine.ast?.callee?.end,
  );
  return createMachine(
    {
      initial: "init",
      states: {
        init: {
          always: [
            {
              cond: "wantsTypegen",
              target: "wantsTypegen",
            },
            {
              target: "doesNotWantTypegen",
            },
          ],
        },
        wantsTypegen: {
          initial: "init",
          states: {
            init: {
              always: [
                {
                  cond: "isMemberExpression",
                  target: "isMemberExpression",
                },
                {
                  target: "isNotMemberExpression",
                },
              ],
            },
            isMemberExpression: {
              initial: "init",
              states: {
                init: {
                  always: [
                    {
                      cond: "hasAtLeastOneType",
                      target: "hasTypes",
                    },
                    {
                      target: "hasNoTypes",
                    },
                  ],
                },
                hasTypes: {
                  entry: ["updateSingleTypeArgument"],
                  type: "final",
                },
                hasNoTypes: {
                  entry: ["addSingleTypeArgument"],
                  type: "final",
                },
              },
            },
            isNotMemberExpression: {
              initial: "init",
              states: {
                init: {
                  always: [
                    {
                      cond: "hasFourTypes",
                      target: "hasFourTypes",
                    },
                    {
                      cond: "hasAtLeastOneType",
                      target: "hasLessThanFourTypes",
                    },
                    {
                      target: "hasNoTypes",
                    },
                  ],
                },
                hasNoTypes: {
                  entry: ["appendFourTypes"],
                  type: "final",
                },
                hasLessThanFourTypes: {
                  entry: ["overwriteTypesWithFourTypes"],
                  type: "final",
                },
                hasFourTypes: {
                  entry: ["overwriteFinalType"],
                  type: "final",
                },
              },
            },
          },
        },
        doesNotWantTypegen: {
          initial: "init",
          states: {
            init: {
              always: [
                {
                  cond: "isMemberExpression",
                  target: "isMemberExpression",
                },
                {
                  target: "isNotMemberExpression",
                },
              ],
            },
            isMemberExpression: {
              initial: "init",
              states: {
                init: {
                  always: [
                    {
                      cond: "hasAtLeastOneType",
                      target: "hasTypes",
                    },
                    {
                      target: "hasNoTypes",
                    },
                  ],
                },
                hasTypes: {
                  entry: "removeTypesArgument",
                  type: "final",
                },
                hasNoTypes: {
                  type: "final",
                },
              },
            },
            isNotMemberExpression: {
              initial: "init",
              states: {
                init: {
                  always: [
                    {
                      cond: "hasFourTypes",
                      target: "hasTypes",
                    },
                    {
                      target: "hasNoTypes",
                    },
                  ],
                },
                hasNoTypes: {
                  type: "final",
                },
                hasTypes: {
                  entry: [
                    choose([
                      {
                        cond: "areFirstThreeGenericsDefaults",
                        actions: ["removeTypesArgument"],
                      },
                      {
                        actions: "removeFinalTypeArgument",
                      },
                    ]),
                  ],
                  type: "final",
                },
              },
            },
          },
        },
      },
    },
    {
      guards: {
        wantsTypegen: () => Boolean(machine.ast?.definition?.tsTypes?.value),
        isMemberExpression: () => Boolean(machine?.ast?.isMemberExpression),
        hasAtLeastOneType: () => (typeArguments?.params.length || 0) > 0,
        hasFourTypes: () => typeArguments?.params.length === 4,
        areFirstThreeGenericsDefaults: () => {
          return (
            typeArgumentsRaw[0].trim() === "unknown" &&
            typeArgumentsRaw[1].trim() === "{ type: string }" &&
            typeArgumentsRaw[2].trim() === "any"
          );
        },
      },
      actions: {
        overwriteFinalType: () => {
          const position = getRangeFromSourceLocation(
            typeArguments.params[3].loc,
          );

          pushTextEdit(
            new vscode.TextEdit(
              new vscode.Range(
                new vscode.Position(
                  position.start.line,
                  position.start.character,
                ),
                new vscode.Position(position.end.line, position.end.character),
              ),
              `import('./${relativePath}.typegen').Typegen${machineIndex}`,
            ),
          );
        },
        removeFinalTypeArgument: () => {
          const position = getRangeFromSourceLocation(typeArguments.loc);

          pushTextEdit(
            new vscode.TextEdit(
              new vscode.Range(
                new vscode.Position(
                  position.start.line,
                  position.start.character,
                ),
                new vscode.Position(position.end.line, position.end.character),
              ),
              `<${typeArgumentsRaw.slice(0, -1).join(", ")}>`,
            ),
          );
        },
        updateSingleTypeArgument: () => {
          const position = getRangeFromSourceLocation(typeArguments.loc);

          pushTextEdit(
            new vscode.TextEdit(
              new vscode.Range(
                new vscode.Position(
                  position.start.line,
                  position.start.character,
                ),
                new vscode.Position(position.end.line, position.end.character),
              ),
              `<import('./${relativePath}.typegen').Typegen${machineIndex}>`,
            ),
          );
        },
        appendFourTypes: () => {
          const position = getRangeFromSourceLocation(machine.ast.callee.loc);

          pushTextEdit(
            new vscode.TextEdit(
              new vscode.Range(
                new vscode.Position(
                  position.start.line,
                  position.start.character,
                ),
                new vscode.Position(position.end.line, position.end.character),
              ),
              `${calleeRaw}<unknown, { type: string }, any, import('./${relativePath}.typegen').Typegen${machineIndex}>`,
            ),
          );
        },
        overwriteTypesWithFourTypes: () => {
          const position = getRangeFromSourceLocation(typeArguments.loc);

          const withDefaults = addDefaultsToTypeArguments(typeArgumentsRaw);

          pushTextEdit(
            new vscode.TextEdit(
              new vscode.Range(
                new vscode.Position(
                  position.start.line,
                  position.start.character,
                ),
                new vscode.Position(position.end.line, position.end.character),
              ),
              `<${withDefaults
                .slice(0, 3)
                .join(
                  ", ",
                )}, import('./${relativePath}.typegen').Typegen${machineIndex}>`,
            ),
          );
        },
        removeTypesArgument: () => {
          const position = getRangeFromSourceLocation(typeArguments.loc);
          pushTextEdit(
            new vscode.TextEdit(
              new vscode.Range(
                new vscode.Position(
                  position.start.line,
                  position.start.character,
                ),
                new vscode.Position(position.end.line, position.end.character),
              ),
              ``,
            ),
          );
        },
        addSingleTypeArgument: () => {
          const position = getRangeFromSourceLocation(machine.ast.callee.loc);

          pushTextEdit(
            new vscode.TextEdit(
              new vscode.Range(
                new vscode.Position(
                  position.start.line,
                  position.start.character,
                ),
                new vscode.Position(position.end.line, position.end.character),
              ),
              `${calleeRaw}<import('./${relativePath}.typegen').Typegen${machineIndex}>`,
            ),
          );
        },
      },
    },
  );
};

const addDefaultsToTypeArguments = (typeArguments: string[]) => {
  const newTypeArguments = [...typeArguments];

  if (newTypeArguments.length === 0) {
    newTypeArguments.push("unknown", `{ type: string }`, `any`);
  } else if (newTypeArguments.length === 1) {
    newTypeArguments.push(`{ type: string }`, `any`);
  } else if (newTypeArguments.length === 2) {
    newTypeArguments.push(`any`);
  }

  return newTypeArguments;
};
