import type { MachineParseResult } from "xstate-parser-demo/lib/MachineParseResult";

export const getInlineImplementations = (
  parseResult: MachineParseResult | undefined,
) => {
  const allGuards =
    parseResult?.getAllConds(["inline", "identifier", "unknown"]) || [];

  const allServices =
    parseResult?.getAllServices(["inline", "identifier", "unknown"]) || [];

  const allActions =
    parseResult?.getAllActions(["inline", "identifier", "unknown"]) || [];

  return [...allGuards, ...allServices, ...allActions];
};
