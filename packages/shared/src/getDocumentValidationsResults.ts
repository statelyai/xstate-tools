import { createMachine } from "xstate";
import { parseMachinesFromFile } from "@xstate/machine-extractor";
import { DocumentValidationsResult } from "./types";
import { filterOutIgnoredMachines } from "./filterOutIgnoredMachines";
import { introspectMachine } from "./introspectMachine";

export const getDocumentValidationsResults = (
  text: string,
): DocumentValidationsResult[] => {
  return filterOutIgnoredMachines(parseMachinesFromFile(text)).machines.map(
    (parseResult) => {
      if (!parseResult) {
        return {
          documentText: text,
        };
      }

      const config = parseResult.toConfig();
      try {
        const machine: any = createMachine(config as any);
        const introspectionResult = introspectMachine(machine as any);
        return {
          parseResult,
          machine,
          introspectionResult,
          documentText: text,
        };
      } catch (e) {
        return {
          parseResult,
          documentText: text,
        };
      }
    },
  );
};
