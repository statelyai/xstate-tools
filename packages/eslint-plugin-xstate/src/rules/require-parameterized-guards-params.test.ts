import { ESLintUtils } from "@typescript-eslint/utils";
import outdent from "outdent";
import rule from "./require-parameterized-guards-params";

const ruleTester = new ESLintUtils.RuleTester({
  parser: "@typescript-eslint/parser",
});

ruleTester.run("require-parameterized-guards-params", rule, {
  valid: [
    {
      code: outdent`
        createMachine({
          on: {
            event: {
              guard: 'searchValid'
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
              guard: {
                type: 'searchValid'
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
              guard: {
                type: 'searchValid',
                params: {
                  minQueryLength: 3
                }
              }
            }
          }
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
              guard: {
                type: 'searchValid',
                minQueryLength: 3,
              }
            }
          }
        })
      `,
      errors: [{ messageId: "moveGuardParamsIntoParamsObject" }],
    },
  ],
});
