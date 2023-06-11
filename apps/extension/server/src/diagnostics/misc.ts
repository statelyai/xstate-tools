import { createIntrospectableMachine } from '@xstate/tools-shared';
import { DiagnosticSeverity } from 'vscode-languageserver';
import { Range } from 'vscode-languageserver-textdocument';
import { DiagnosticGetter } from '../getDiagnostics';

// TODO - refactor
export const miscDiagnostics: DiagnosticGetter = (
  machineResult,
  textDocument,
) => {
  try {
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

    const machine = createIntrospectableMachine(machineResult);
    machine.transition(machine.initialState, {} as any);
  } catch (e) {
    const range: Range = {
      start: textDocument.positionAt(
        machineResult.machineCallResult?.definition?.node.start || 0,
      ),
      end: textDocument.positionAt(
        machineResult.machineCallResult?.definition?.node.end || 0,
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
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
        message: (e as any).message,
        range,
        severity: DiagnosticSeverity.Error,
      },
    ];
  }
  return [];
};
