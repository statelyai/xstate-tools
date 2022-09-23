import { ESLintUtils } from "@typescript-eslint/utils";
import outdent from "outdent";
import rule from "./no-factory-context-arg";

const ruleTester = new ESLintUtils.RuleTester({
  parser: "@typescript-eslint/parser",
});

ruleTester.run("no-factory-context-arg", rule, {
  valid: [
    {
      code: outdent`
				createMachine({}, {})
      `,
    },
  ],
  invalid: [
    {
      code: outdent`
				createMachine({}, {}, {})
      `,
      errors: [{ messageId: "removeContextArg" }],
    },
  ],
});
