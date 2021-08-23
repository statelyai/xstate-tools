import { DiagnosticSeverity } from "vscode-languageserver";
import { Range } from "vscode-languageserver-textdocument";
import { ConditionPredicate, createMachine } from "xstate";
import { DiagnosticGetter } from "../getDiagnostics";

// TODO - refactor
export const miscDiagnostics: DiagnosticGetter = (machine, textDocument) => {
  try {
    const config = machine.parseResult?.toConfig();
    if (!config) return [];

    const guards: Record<string, ConditionPredicate<any, any>> = {};
    machine.introspectionResult?.guards.lines.forEach((cond) => {
      guards[cond.name] = () => true;
    });

    // const orphanedStates = getOrphanedStates(machine);

    // diagnostics.push(
    //   ...orphanedStates.map((state) => {
    //     return {
    //       range: getRangeFromSourceLocation(state.location),
    //       message: `This state node is unused - no other node transitions to it.`,
    //       severity: DiagnosticSeverity.Warning,
    //     };
    //   }),
    // );

    const createdMachine = createMachine(config, {
      guards,
    });

    createdMachine.transition(createdMachine.initialState, {});
  } catch (e) {
    let range: Range = {
      start: textDocument.positionAt(
        machine.parseResult?.ast?.definition?.node.start || 0,
      ),
      end: textDocument.positionAt(
        machine.parseResult?.ast?.definition?.node.end || 0,
      ),
    };
    // if (
    //   e.message.includes("Invalid transition definition for state node")
    // ) {
    //   const index = (e.message as string).indexOf("Child state");

    //   const stateId = e.message.slice(
    //     "Invalid transition definition for state node ".length + 1,
    //     index - 3,
    //   );

    //   const itemToFind = "Child state '";

    //   const targetValue = e.message.slice(
    //     e.message.indexOf(itemToFind) + itemToFind.length,
    //     e.message.indexOf("' does not exist on '"),
    //   );

    //   const [, ...path] = stateId.split(".");

    //   const parsedTarget = machine.statesMeta
    //     .find((state) => state.path.join() === path.join())
    //     ?.targets.find((target) => {
    //       return target.target === targetValue;
    //     });

    //   if (parsedTarget) {
    //     range = {
    //       end: textDocument.positionAt(
    //         parsedTarget.location.end.absoluteChar,
    //       ),
    //       start: textDocument.positionAt(
    //         parsedTarget.location.start.absoluteChar,
    //       ),
    //     };
    //   }
    // }
    // if (e.message.includes("Initial state")) {
    //   const index = (e.message as string).indexOf("not found on '");
    //   const stateId = e.message.slice(index, index - 1);

    //   const [, ...path] = stateId.split(".");

    //   const parsedState = machine.statesMeta.find(
    //     (state) => state.path.join() === path.join(),
    //   );

    //   if (parsedState?.initial) {
    //     range = {
    //       end: textDocument.positionAt(
    //         parsedState.initial.location.end.absoluteChar,
    //       ),
    //       start: textDocument.positionAt(
    //         parsedState.initial.location.start.absoluteChar,
    //       ),
    //     };
    //   }
    // }
    return [
      {
        message: e.message,
        range,
        severity: DiagnosticSeverity.Error,
      },
    ];
  }
  return [];
};
