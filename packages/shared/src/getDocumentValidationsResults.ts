import { parseMachinesFromFile } from "@xstate/machine-extractor";
import { createMachine } from "xstate";
import { filterOutIgnoredMachines } from "./filterOutIgnoredMachines";
import { introspectMachine } from "./introspectMachine";
import { DocumentValidationsResult } from "./types";

export const getDocumentValidationsResults = (
  text: string
): DocumentValidationsResult[] => {
  return filterOutIgnoredMachines(parseMachinesFromFile(text)).machines.map(
    (parseResult) => {
      if (!parseResult) {
        return {
          documentText: text,
        };
      }

      const config = parseResult.toConfig();
      const chooseActionsForOptions =
        parseResult.getChooseActionsToAddToOptions();
      const groupActionsForOptions =
        parseResult.getActionGroupsToAddToOptions();
      try {
        const machine: any = createMachine(config as any, {
          actions: { ...chooseActionsForOptions, ...groupActionsForOptions },
        });
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
    }
  );
};
