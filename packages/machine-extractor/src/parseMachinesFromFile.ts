import { parse, Node, types as t, traverse } from "@babel/core";
import { MachineConfig } from "xstate";
import { MachineCallExpression } from "./machineCallExpression";
import { MachineParseResult } from "./MachineParseResult";
import { toMachineConfig } from "./toMachineConfig";
import { ParseResult } from "./types";
import { hashedId } from "./utils";

export const parseMachinesFromFile = (fileContents: string): ParseResult => {
  if (
    !fileContents.includes("createMachine") &&
    !fileContents.includes("Machine")
  ) {
    return {
      machines: [],
      comments: [],
      file: undefined,
    };
  }

  const parseResult = parse(fileContents, {
    sourceType: "module",
    configFile: false,
    babelrc: false,
    parserOpts: {
      plugins: [
        "typescript",
        "jsx",
        ["decorators", { decoratorsBeforeExport: false }],
      ],
    }
  }) as t.File;

  let result: ParseResult = {
    machines: [],
    comments: [],
    file: parseResult,
  };

  parseResult.comments?.forEach((comment) => {
    if (comment.value.includes("xstate-ignore-next-line")) {
      result.comments.push({
        node: comment,
        type: "xstate-ignore-next-line",
      });
    } else if (comment.value.includes("@xstate-layout")) {
      result.comments.push({
        node: comment,
        type: "xstate-layout",
      });
    }
  });

  const getNodeHash = (node: Node): string => {
    const fileText = fileContents.substring(node.start!, node.end!);
    return hashedId(fileText);
  };

  traverse(parseResult as any, {
    CallExpression(path) {
      const ast = MachineCallExpression.parse(path.node as any, {
        file: parseResult,
        getNodeHash: getNodeHash,
      });
      if (ast) {
        result.machines.push(
          new MachineParseResult({
            ast,
            fileComments: result.comments,
            scope: path.scope,
          }),
        );
      }
    },
  });

  return result;
};
