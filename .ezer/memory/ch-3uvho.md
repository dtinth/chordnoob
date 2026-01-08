---
type: note
created: '2026-01-08T15:36:48.668Z'
---
# Bun + TypeScript Setup

Project initialization steps:
1. `bun init`
2. `bun add @tsconfig/bun --dev` - stricter TypeScript config
3. Replace tsconfig.json with: `{ "extends": "@tsconfig/bun/tsconfig.json" }`
4. `bun add @types/node --dev` - fixes Buffer/Uint8Array type issues
5. `mise use bun@latest` - pin Bun version for reproducibility
