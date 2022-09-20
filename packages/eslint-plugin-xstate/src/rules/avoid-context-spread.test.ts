import { ESLintUtils } from "@typescript-eslint/utils";
import outdent from "outdent";
import rule from "./avoid-context-spread";

const ruleTester = new ESLintUtils.RuleTester({
  parser: "@typescript-eslint/parser",
});

ruleTester.run("avoid-context-spread", rule, {
  valid: [
    {
      code: outdent`
				machine.withContext({
					key: 'value',
				})
			`,
    },
  ],
  invalid: [
    {
      code: outdent`
				machine.withContext({
					key: 'value',
					...machine.context,
				})
			`,
      output: outdent`
				machine.withContext({
					key: 'value',
				})
			`,
      errors: [{ messageId: "avoidSpread" }],
    },
    {
      code: outdent`
				machine.withContext({
					key: 'value', ...machine.context,
				})
			`,
      output: outdent`
				machine.withContext({
					key: 'value',
				})
			`,
      errors: [{ messageId: "avoidSpread" }],
    },
  ],
});
