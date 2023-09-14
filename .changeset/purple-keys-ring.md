---
'@xstate/machine-extractor': minor
---

- Drops `{type, value}` structure in favor of simpler values
- Changes action structure to accept `kind` and push properties under `action` object
- Extracts expressions wrapped in doubly curly braces `{{}}`
- Extracts array and object values recursively (previously extracted as expressions)
- Drops using XState types in favor of adding local types for Action, StateNodeConfig, etc
- Makes `id` and `delay` in `sendTo` actions, optional and doesn't include them in extracted action when not present
- Creates specific parser for `SendTo` actions to treat them as builtin actions
