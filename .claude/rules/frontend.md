---
paths:
  - "src/**/*.ts"
  - "src/**/*.tsx"
  - "src/**/*.css"
  - "index.html"
---

# Frontend Rule

Follow [AGENTS.md](../../AGENTS.md) §Frontend Rules and §Coding Conventions. Highlights:

- Feature-scoped work lives in `src/features/<feature>/`. Only promote to `src/components/` when truly reused across features.
- The project shell at `src/features/workspace/ProjectShell.tsx` owns its own header + progress strip; do not nest `AppScaffold` inside `/workspace/*` routes.
- Step status derives from `src/features/projects/project-progress.ts`. Reuse it; do not recompute status ad hoc in components.
- The persisted project shape is a contract: changes must land in `src/types/domain.ts`, `src/features/projects/project-service.ts`, `src/features/projects/project-store.ts`, and `src-tauri/src/domain/project.rs` in the same PR.
- Use Zustand for app-level stores, React Hook Form + Zod for forms, `clsx` for conditional classes, design tokens in `src/styles/tokens.css`. Do not introduce a new state manager, UI framework, or styling system without approval.
- File naming: kebab-case `.ts`, PascalCase React components, camelCase identifiers.
- Run `bun run typecheck && bun run lint && bun run test` before declaring a change done.
