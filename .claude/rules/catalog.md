---
paths:
  - "catalog/**"
  - "src/features/catalog/**"
  - "src/types/**"
---

# Catalog Rule

Follow [AGENTS.md](../../AGENTS.md) §Catalog Rules. Highlights:

- `catalog/controllers/*.json` and `catalog/components/*.json` are loaded at runtime by `src/features/catalog/` and validated again by `src-tauri/src/domain/` when projects reference catalog IDs.
- One JSON file per part. Filename matches the part's `id` (kebab-case).
- Controller files require: `id`, `name`, `packageName`, `voltage`, `protocols`, `interfaces[]` with `signalPins[]`.
- Component files require the supported `protocols` plus any signal metadata the connection planner needs.
- Adding a new part is a normal contribution. **Changing the schema is not** — flag schema changes explicitly in the PR description.
- A schema change must land in the same PR as:
  1. Updated TS types in `src/types/domain.ts` (and any Zod schema in `src/features/catalog/`).
  2. Updated Rust validation in `src-tauri/src/domain/`.
  3. Tests covering the new field.
  4. Migration of every existing JSON file in `catalog/` (no half-migrated files).
- After changes: `bun run typecheck && bun run test && bun run rust:test`.
