import type { MachineExtractResult } from '@xstate/machine-extractor';
import { getRawTextFromNode, ImplementationsMetadata } from '.';

/**
 * This function takes the AST of a parsed machine (the MachineParseResult)
 * and returns a map of all of its inline implementations (ImplementationsMetadata).
 *
 * Each inline implementation is stored by a hash (its inlineImplemenationId)
 * and stores the raw text of its node.
 */
export const getInlineImplementations = (
  parseResult: MachineExtractResult | undefined,
  fileText: string,
): ImplementationsMetadata => {
  const allGuards =
    /**
     * We don't ask for 'named' implementations here,
     * since they're not declared inline
     */
    parseResult?.getAllConds(['inline', 'identifier', 'unknown']) || [];

  const allServices =
    parseResult?.getAllServices(['inline', 'identifier', 'unknown']) || [];

  const allActions =
    parseResult?.getAllActions(['inline', 'identifier', 'unknown']) || [];

  const inlineImplementations: ImplementationsMetadata = {
    actions: {},
    guards: {},
    services: {},
  };

  allGuards.forEach((guard) => {
    inlineImplementations.guards[
      /**
       * The inlineDeclarationId comes from @xstate/machine-extractor,
       * and is a hash of the inline declaration's text.
       */
      guard.inlineDeclarationId
    ] = {
      jsImplementation: getRawTextFromNode(fileText, guard.node),
    };
  });
  allActions.forEach((action) => {
    inlineImplementations.actions[action.inlineDeclarationId] = {
      jsImplementation: getRawTextFromNode(fileText, action.node),
    };
  });
  allServices.forEach((service) => {
    if (service.srcNode) {
      inlineImplementations.services[service.inlineDeclarationId] = {
        jsImplementation: getRawTextFromNode(fileText, service.srcNode),
      };
    }
  });

  return inlineImplementations;
};
