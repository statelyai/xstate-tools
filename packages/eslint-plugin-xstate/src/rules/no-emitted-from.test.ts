import { ESLintUtils } from "@typescript-eslint/utils";
import outdent from "outdent";
import rule from "./no-emitted-from";

const ruleTester = new ESLintUtils.RuleTester({
  parser: "@typescript-eslint/parser",
});

ruleTester.run("no-emitted-from", rule, {
  valid: [
    {
      code: outdent`
        import {SnapshotFrom} from 'xstate'

        type Snapshot = SnapshotFrom<typeof actorRef>
      `,
    },
    {
      code: outdent`
        import type {SnapshotFrom} from 'xstate'

        type Snapshot = SnapshotFrom<typeof actorRef>
      `,
    },
    {
      code: outdent`
        import * as XState from 'xstate'

        type Snapshot = XState.SnapshotFrom<typeof actorRef>
      `,
    },
  ],
  invalid: [
    {
      code: outdent`
        import {EmittedFrom} from 'xstate'

        type EmittedValue = EmittedFrom<typeof actorRef>
      `,
      output: outdent`
        import {SnapshotFrom} from 'xstate'

        type EmittedValue = SnapshotFrom<typeof actorRef>
      `,
      errors: [{ messageId: "replaceEmittedFromImport" }],
    },
    {
      code: outdent`
        import type {EmittedFrom} from 'xstate'

        type EmittedValue = EmittedFrom<typeof actorRef>
      `,
      output: outdent`
        import type {SnapshotFrom} from 'xstate'

        type EmittedValue = SnapshotFrom<typeof actorRef>
      `,
      errors: [{ messageId: "replaceEmittedFromImport" }],
    },
    {
      code: outdent`
        import {EmittedFrom as Emitted} from 'xstate'

        type EmittedValue = Emitted<typeof actorRef>
      `,
      output: outdent`
        import {SnapshotFrom as Emitted} from 'xstate'

        type EmittedValue = Emitted<typeof actorRef>
      `,
      errors: [{ messageId: "replaceEmittedFromImport" }],
    },
    {
      code: outdent`
        import * as XState from 'xstate'

        type EmittedActorValue = XState.EmittedFrom<typeof actorRef>
        type EmittedServiceValue = XState.EmittedFrom<typeof service>
      `,
      output: outdent`
        import * as XState from 'xstate'

        type EmittedActorValue = XState.SnapshotFrom<typeof actorRef>
        type EmittedServiceValue = XState.SnapshotFrom<typeof service>
      `,
      errors: [
        { messageId: "replaceEmittedFromQualifiedIdentifier" },
        { messageId: "replaceEmittedFromQualifiedIdentifier" },
      ],
    },
  ],
});
