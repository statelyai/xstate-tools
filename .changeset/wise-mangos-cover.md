---
'stately-vscode': minor
---

author: @andreash
author: @Andarist

Introduced a new opt-in option `useDeclarationFileForTypegenData`. It's the recommended way of using this extension and typegen and it fixes compatibility with modern `moduleResolution` options in TypeScript. It can also help you to avoid issues in frameworks that derive pages based on the directory content (such as Nuxt).

Enabling this might require using at least TypeScript 5.0.
