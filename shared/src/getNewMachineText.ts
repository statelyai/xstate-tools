import * as prettier from "prettier";
import { MachineConfig } from "xstate";
import { MachineParseResult } from "xstate-parser-demo/src/MachineParseResult";
import {
  getRawTextFromNode,
  ImplementationsMetadata,
} from "xstate-vscode-shared";

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

export const getNewMachineText = async ({
  text,
  fileName,
  newConfig,
  machine,
  implementations,
}: {
  text: string;
  newConfig: MachineConfig<any, any, any>;
  fileName: string;
  machine: MachineParseResult;
  implementations: ImplementationsMetadata;
}): Promise<string> => {
  const nodesToPreserve: string[] = STATE_KEYS_TO_PRESERVE.map((nodeKey) => {
    const node =
      machine.ast.definition?.[nodeKey]?._valueNode ||
      machine.ast.definition?.[nodeKey]?.node;
    return node
      ? `\n${nodeKey}: ${getRawTextFromNode(text, node!).replace("\n", " ")},`
      : "";
  });

  const json = JSON.stringify(
    newConfig,
    (key, value) => {
      if (
        key === "cond" &&
        implementations?.implementations?.guards?.[value]?.jsImplementation
      ) {
        return markAsUnwrap(
          implementations?.implementations?.guards?.[value]?.jsImplementation!,
        );
      }
      if (
        key === "src" &&
        implementations?.implementations?.services?.[value]?.jsImplementation
      ) {
        return markAsUnwrap(
          implementations?.implementations?.services?.[value]
            ?.jsImplementation!,
        );
      }

      if (["actions", "entry", "exit"].includes(key)) {
        if (Array.isArray(value)) {
          return value.map((action) => {
            if (
              implementations?.implementations?.actions?.[action]
                ?.jsImplementation
            ) {
              return markAsUnwrap(
                implementations?.implementations?.actions?.[action]
                  ?.jsImplementation!,
              );
            }
            return action;
          });
        }
        if (
          implementations?.implementations?.actions?.[value]?.jsImplementation
        ) {
          return markAsUnwrap(
            implementations?.implementations?.actions?.[value]
              ?.jsImplementation!,
          );
        }
      }

      return value;
    },
    2,
  );

  const prettierConfig = await prettier.resolveConfig(fileName);

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

  return finalTextToInput;
};
