import { IntrospectMachineResult, SubState } from "@xstate/tools-shared";

export const getStateMatchesObjectSyntax = (
  introspectionResult: IntrospectMachineResult
): string => {
  const getUnionForSubState = (subState: SubState, depth = 0): string => {
    // Do not include sibling states in the union
    // if it's the root
    const states: string[] =
      depth === 0
        ? []
        : Object.keys(subState.states)
            .sort()
            .map((state) =>
              JSON.stringify(state, (_key, value) => {
                if (typeof value !== "object") {
                  return value;
                }
                return Object.keys(value).reduce<Record<string, any>>(
                  (acc, key) => {
                    acc[key] = value[key];
                    return acc;
                  },
                  {}
                );
              })
            );

    const substatesWithChildren = Object.entries(subState.states).filter(
      ([, value]) => {
        return Object.keys(value.states).length > 0;
      }
    );

    if (substatesWithChildren.length > 0) {
      states.push(
        `{ ${substatesWithChildren
          .sort(([stateA], [stateB]) => (stateA < stateB ? -1 : 1))
          .map(([state, value]) => {
            return `${JSON.stringify(state)}?: ${getUnionForSubState(
              value,
              depth + 1
            )};`;
          })
          .join("\n")} }`
      );
    }
    return `${states.join(" | ")}`;
  };

  return getUnionForSubState(introspectionResult.subState);
};
