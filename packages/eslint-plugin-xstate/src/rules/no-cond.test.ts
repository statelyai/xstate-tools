import { ESLintUtils } from "@typescript-eslint/utils";
import outdent from "outdent";
import rule from "./no-cond";

const ruleTester = new ESLintUtils.RuleTester({
  parser: "@typescript-eslint/parser",
});

ruleTester.run("no-use-cond", rule, {
  valid: [
    {
      code: outdent`
        createMachine({
          on: {
            event: {
              guard: 'guard'
            }
          }
        })
      `,
    },
    {
      code: outdent`
        const thing = {
          on: {
            event: {
              cond: 'guard'
            }
          }
        }
      `,
    },
  ],
  invalid: [
    {
      code: outdent`
        createMachine({
          on: {
            event: {
              cond: 'guard'
            }
          }
        })
      `,
      output: outdent`
        createMachine({
          on: {
            event: {
              guard: 'guard'
            }
          }
        })
      `,
      errors: [{ messageId: "renameCond" }],
    },
  ],
});
