import { DocumentValidationsResult, XStateUpdateEvent } from "./types";
import { resolveUriToFilePrefix } from "./resolveUriToFilePrefix";

export const makeXStateUpdateEvent = (
  uri: string,
  machines: Pick<DocumentValidationsResult, "parseResult">[],
): XStateUpdateEvent => {
  return {
    uri: resolveUriToFilePrefix(uri),
    machines: machines.map((machine, index) => {
      const config = machine.parseResult?.toConfig()!;
      return {
        config,
        index,
        typeNodeLoc: machine.parseResult?.ast?.definition?.tsTypes?.node.loc,
        definitionLoc: machine.parseResult?.ast?.definition?.node.loc,
        guardsToMock:
          machine.parseResult
            ?.getAllConds(["named"])
            .map((elem) => elem.name) || [],
        allServices:
          machine.parseResult
            ?.getAllServices(["named"])
            .map((elem) => ({ src: elem.src, id: elem.id })) || [],
        actionsInOptions:
          machine.parseResult?.ast?.options?.actions?.properties.map(
            (property) => property.key,
          ) || [],
        delaysInOptions:
          machine.parseResult?.ast?.options?.delays?.properties.map(
            (property) => property.key,
          ) || [],
        guardsInOptions:
          machine.parseResult?.ast?.options?.guards?.properties.map(
            (property) => property.key,
          ) || [],
        servicesInOptions:
          machine.parseResult?.ast?.options?.services?.properties.map(
            (property) => property.key,
          ) || [],
        tags: Array.from(
          new Set(
            machine.parseResult
              ?.getAllStateNodes()
              .flatMap(
                (node) => node.ast.tags?.map((tag) => tag.value) || [],
              ) || [],
          ),
        ),
        hasTypesNode: Boolean(
          machine.parseResult?.ast?.definition?.tsTypes?.node,
        ),
      };
    }),
  };
};
