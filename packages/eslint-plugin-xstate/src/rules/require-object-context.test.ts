import { ESLintUtils } from "@typescript-eslint/utils";
import outdent from "outdent";
import rule from "./require-object-context";

const ruleTester = new ESLintUtils.RuleTester({
  parser: "@typescript-eslint/parser",
});

ruleTester.run("require-object-context", rule, {
  valid: [
    {
      code: outdent`
        createMachine({
          context: {}
        })
      `,
    },
    {
      code: outdent`
        createMachine({})
      `,
    },
  ],
  invalid: [
    {
      code: outdent`
        createMachine({
          context: 'string'
        })
      `,
      errors: [{ messageId: "mustUseContextObject" }],
    },
    {
      code: outdent`
        createMachine({
          context: 10
        })
      `,
      errors: [{ messageId: "mustUseContextObject" }],
    },
    {
      code: outdent`
        createMachine({
          context: []
        })
      `,
      errors: [{ messageId: "mustUseContextObject" }],
    },
    {
      code: outdent`
        createMachine({
          context: undefined
        })
      `,
      errors: [{ messageId: "mustUseContextObject" }],
    },
  ],
});
