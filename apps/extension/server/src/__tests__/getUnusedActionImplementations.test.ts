import { extractMachinesFromFile } from '@xstate/machine-extractor';
import { DiagnosticSeverity } from 'vscode-languageserver';
import { getUnusedActionImplementations } from '../diagnostics/getUnusedActionImplementations';

test('returns a Diagnostic for each unused action in the machine', () => {
  const result = extractMachinesFromFile(`
		createMachine(
			{},
			{
				actions: {
					action1: () => {},
					action2: () => {},
				},
			},
		);
	`);
  const diagnostics = getUnusedActionImplementations(
    result!.machines[0]!,
    undefined!,
    undefined!,
  );

  expect(diagnostics).toHaveLength(2);

  for (const action of ['action1', 'action2']) {
    expect(diagnostics).toContainEqual({
      message: `${action} is never used in the machine definition`,
      range: {
        start: {
          character: expect.any(Number),
          line: expect.any(Number),
        },
        end: {
          character: expect.any(Number),
          line: expect.any(Number),
        },
      },
      severity: DiagnosticSeverity.Warning,
    });
  }
});

test('does not return a Diagnostic for actions used in the machine', () => {
  const result = extractMachinesFromFile(`
		createMachine(
			{
				entry: ['action1', { type: 'action2' }],
			},
			{
				actions: {
					action1: () => {},
					action2: () => {},
				},
			},
		);
	`);
  const diagnostics = getUnusedActionImplementations(
    result!.machines[0]!,
    undefined!,
    undefined!,
  );

  expect(diagnostics).toHaveLength(0);
});
