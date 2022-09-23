import { ESLintUtils } from "@typescript-eslint/utils";
import outdent from "outdent";
import rule from "./require-parameterized-actions-params";

const ruleTester = new ESLintUtils.RuleTester({
  parser: "@typescript-eslint/parser",
});

ruleTester.run("require-parameterized-actions-params", rule, {
  valid: [
    {
      code: outdent`
        createMachine({
          on: {
            event: {
              action: {
                type: 'someAction',
                params: {
                  message: 'Hello',
                }
              }
            }
          }
        })
      `,
    },
    {
      code: outdent`
        createMachine({
          on: {
            event: {
              action: [
                {
                  type: 'someAction',
                  params: {
                    message: 'Hello',
                  }
                }
              ]
            }
          }
        })
      `,
    },
    {
      code: outdent`
        createMachine({
          entry: {
            type: 'someAction',
            params: {
              message: 'Hello',
            }
          }
        })
      `,
    },
    {
      code: outdent`
        createMachine({
          entry: [
            {
              type: 'someAction',
              params: {
                message: 'Hello',
              }
            }
          ]
        })
      `,
    },
    {
      code: outdent`
        createMachine({
          exit: {
            type: 'someAction',
            params: {
              message: 'Hello',
            }
          }
        })
      `,
    },
    {
      code: outdent`
        createMachine({
          exit: [
            {
              type: 'someAction',
              params: {
                message: 'Hello',
              }
            }
          ]
        })
      `,
    },
  ],
  invalid: [
    {
      code: outdent`
        createMachine({
          on: {
            event: {
              action: {
                type: 'someAction',
                message: 'Hello',
              }
            }
          }
        })
      `,
      errors: [{ messageId: "moveActionParamsIntoParamsObject" }],
    },
    {
      code: outdent`
        createMachine({
          on: {
            event: [
              {
                action: {
                  type: 'someAction',
                  message: 'Hello',
                }
              }
            ]
          }
        })
      `,
      errors: [{ messageId: "moveActionParamsIntoParamsObject" }],
    },
    {
      code: outdent`
        createMachine({
          entry: {
            type: 'someAction',
            message: 'Hello',
          }
        })
      `,
      errors: [{ messageId: "moveActionParamsIntoParamsObject" }],
    },
    {
      code: outdent`
        createMachine({
          entry: [
            {
              type: 'someAction',
              message: 'Hello',
            }
          ]
        })
      `,
      errors: [{ messageId: "moveActionParamsIntoParamsObject" }],
    },
    {
      code: outdent`
        createMachine({
          exit: {
            type: 'someAction',
            message: 'Hello',
          }
        })
      `,
      errors: [{ messageId: "moveActionParamsIntoParamsObject" }],
    },
    {
      code: outdent`
        createMachine({
          exit: [
            {
              type: 'someAction',
              message: 'Hello',
            }
          ]
        })
      `,
      errors: [{ messageId: "moveActionParamsIntoParamsObject" }],
    },
  ],
});
