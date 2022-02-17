import type { MachineParseResult } from "xstate-parser-demo/src/MachineParseResult";
import { getRawTextFromNode, ImplementationsMetadata } from ".";

export const getInlineImplementations = (
  parseResult: MachineParseResult | undefined,
  fileText: string,
): ImplementationsMetadata => {
  const allGuards =
    parseResult?.getAllConds(["inline", "identifier", "unknown"]) || [];

  const allServices =
    parseResult?.getAllServices(["inline", "identifier", "unknown"]) || [];

  const allActions =
    parseResult?.getAllActions(["inline", "identifier", "unknown"]) || [];

  const inlineImplementations: ImplementationsMetadata = {
    implementations: {
      actions: {},
      guards: {},
      services: {},
    },
  };

  allGuards.forEach((guard) => {
    inlineImplementations.implementations.guards[guard.inlineDeclarationId] = {
      jsImplementation: getRawTextFromNode(fileText, guard.node),
    };
  });
  allActions.forEach((action) => {
    inlineImplementations.implementations.actions[action.inlineDeclarationId] =
      {
        jsImplementation: getRawTextFromNode(fileText, action.node),
      };
  });
  allServices.forEach((service) => {
    if (service.srcNode) {
      inlineImplementations.implementations.services[
        service.inlineDeclarationId
      ] = {
        jsImplementation: getRawTextFromNode(fileText, service.srcNode),
      };
    }
  });

  return inlineImplementations;
};
