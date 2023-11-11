import { extractMachinesFromFile } from '../extractMachinesFromFile';
import { testUtils } from '../testUtils';
import { ExtractrorTransitionNodeConfig } from '../types';

describe('extract guards', () => {
  it('Inline functions should be extracted as inline guards', () => {
    const config = testUtils.getTestMachineConfig(`createMachine({
			initial: 'a',
			states: {
				a: {
					on: {
						event: {target: 'b', cond: () => true}
					}
				},
				b: {}
			}
		  })`);
    expect(
      (config!.states!.a!.on!.event as ExtractrorTransitionNodeConfig).cond,
    ).toMatchInlineSnapshot(`
      {
        "guard": {
          "expr": "{{() => true}}",
        },
        "kind": "inline",
      }
    `);
  });
  it('Identifiers should be extracted as inline guards', () => {
    const config = testUtils.getTestMachineConfig(`createMachine({
			initial: 'a',
			states: {
				a: {
					on: {
						event: {target: 'b', cond: someIdentifier}
					}
				},
				b: {}
			}
		  })`);
    expect(
      (config!.states!.a!.on!.event as ExtractrorTransitionNodeConfig).cond,
    ).toMatchInlineSnapshot(`
      {
        "guard": {
          "expr": "{{someIdentifier}}",
        },
        "kind": "inline",
      }
    `);
  });
  it('Strings should be extracted as named guards', () => {
    const config = testUtils.getTestMachineConfig(`createMachine({
			initial: 'a',
			states: {
				a: {
					on: {
						event: {target: 'b', cond: 'myGuard'}
					}
				},
				b: {}
			}
		  })`);
    expect(
      (config!.states!.a!.on!.event as ExtractrorTransitionNodeConfig).cond,
    ).toMatchInlineSnapshot(`
      {
        "guard": {
          "type": "myGuard",
        },
        "kind": "named",
      }
    `);
  });
  it('Guard objects should be extracted as named guards', () => {
    const config = testUtils.getTestMachineConfig(`createMachine({
			initial: 'a',
			states: {
				a: {
					on: {
						event: {target: 'b', cond: {type: 'myGuard'}}
					}
				},
				b: {}
			}
		  })`);
    expect(
      (config!.states!.a!.on!.event as ExtractrorTransitionNodeConfig).cond,
    ).toMatchInlineSnapshot(`
      {
        "guard": {
          "type": "myGuard",
        },
        "kind": "named",
      }
    `);
  });
  it('Parameterized guards with params as object expression should be extracted as named guards', () => {
    const config = testUtils.getTestMachineConfig(`createMachine({
			initial: 'a',
			states: {
				a: {
					on: {
						event: {target: 'b', cond: {type: 'myGuard', params: {
							a: 'some string',
							b: 2,
							c: true,
							d: [1,2,3, [4,[5]]],
							e: {f1: {}}
						  }}}
					}
				},
				b: {}
			}
		  })`);
    expect(
      (config!.states!.a!.on!.event as ExtractrorTransitionNodeConfig).cond,
    ).toMatchInlineSnapshot(`
      {
        "guard": {
          "params": {
            "a": "some string",
            "b": 2,
            "c": true,
            "d": [
              1,
              2,
              3,
              [
                4,
                [
                  5,
                ],
              ],
            ],
            "e": {
              "f1": {},
            },
          },
          "type": "myGuard",
        },
        "kind": "named",
      }
    `);
  });
  it('Params should be ignored for parameterized actions with params set to any value other than an object expression', () => {
    const config = testUtils.getTestMachineConfig(`createMachine({
			initial: 'a',
			states: {
				a: {
					on: {
						event1: {target: 'b', cond: {type: 'myGuard', params: someIdentifier}},
						event2: {target: 'b', cond: {type: 'myGuard', params: {...a, b: c}}},
						event3: {target: 'b', cond: {type: 'myGuard', params: getParams()}},

					}
				},
				b: {}
			}
		  })`);
    expect(
      ['event1', 'event2', 'event3'].map(
        (event) =>
          (config!.states!.a!.on![event] as ExtractrorTransitionNodeConfig)
            .cond,
      ),
    ).toMatchInlineSnapshot(`
      [
        {
          "guard": {
            "type": "myGuard",
          },
          "kind": "named",
        },
        {
          "guard": {
            "type": "myGuard",
          },
          "kind": "named",
        },
        {
          "guard": {
            "type": "myGuard",
          },
          "kind": "named",
        },
      ]
    `);
  });
});
