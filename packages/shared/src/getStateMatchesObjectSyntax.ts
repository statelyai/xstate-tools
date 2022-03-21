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
        : Object.keys(subState.states).map((state) => JSON.stringify(state));

    const substatesWithChildren = Object.entries(subState.states).filter(
      ([, value]) => {
        return Object.keys(value.states).length > 0;
      }
    );

    if (substatesWithChildren.length > 0) {
      states.push(
        `{ ${substatesWithChildren
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
