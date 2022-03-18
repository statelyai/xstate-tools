import { Node } from "@babel/core";
import { getRawTextFromNode } from "./getRawTextFromNode";

export const doesTsTypesRequireUpdate = (opts: {
  fileText: string;
  node: Node;
  relativePath: string;
  machineIndex: number;
}) => {
  const currentText = getRawTextFromNode(opts.fileText, opts.node);

  const requiresUpdate =
    !currentText.includes(`./${opts.relativePath}.typegen`) ||
    !currentText.includes(`Typegen${opts.machineIndex}`);

  return requiresUpdate;
};
