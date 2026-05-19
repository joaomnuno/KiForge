# KiForge Agent Instructions

Canonical guidance for any AI coding agent (Codex, Claude Code, Copilot, etc.) working in this repo. Claude-specific notes live in `CLAUDE.md`; everything technical lives here.

## Project Overview

KiForge is a Tauri v2 + React desktop workspace for planning hardware projects **before** opening KiCad. Users pick a controller, add devices from a curated catalog, plan logical connections (SPI / I2C / UART / shared buses), assign concrete pins, see validation issues, and export a starter project bundle.

The mental model: KiForge = project-definition workspace; KiCad = where the real schematic lives. KiForge is not a schematic editor, PCB tool, simulator, or auto-router.

The current roadmap and exit criteria for v0.1 live in [docs/roadmap.md](docs/roadmap.md). Read it before proposing scope.

## Stack

- **Package manager:** Bun (canonical lockfile is `bun.lock`; `package-lock.json` is removed)
- **Frontend:** Vite 6, React 19, TypeScript 5.8, React Router 6, React Hook Form 7, Zod 3, Zustand 5
- **Desktop shell:** Tauri 2.x (`@tauri-apps/api`, `@tauri-apps/cli`)
- **Backend:** Rust edition 2021, `rust-version = "1.77"`, `tauri = "2.0"`, `tauri-build = "2.0"`, `serde`, `serde_json`, `time`, `tempfile` (dev)
- **Testing:** Vitest 3 (jsdom), Testing Library, `cargo test`
- **Lint/format:** ESLint 9 flat config, `typescript-eslint`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`, Prettier 3
- **CI:** GitHub Actions matrix (Ubuntu / macOS / Windows) running Bun-based scripts plus `cargo fmt` / `clippy` / `test`

## Repository Layout

- `src/app/` — root `App.tsx`, test setup, top-level wiring
- `src/components/` — reusable presentational + layout primitives (`components/layout/`, `components/ui/`)
- `src/features/` — feature modules: `catalog/`, `components/`, `connections/`, `projects/`, `settings/`, `templates/`, `workspace/`
- `src/lib/` — small shared helpers (`date-format.ts`, `runtime.ts`)
- `src/data/` — static structured app data (`navigation.ts`)
- `src/types/` — shared TypeScript domain types (`domain.ts`)
- `src/styles/` — `tokens.css` (design tokens) + `index.css` (global styles)
- `catalog/components/` — JSON peripheral definitions (one file per part)
- `catalog/controllers/` — JSON MCU definitions (interfaces, signal-pin maps)
- `design-files/` — UI/UX planning references; `PLAN.md` is the product definition that the implementation is meant to match
- `docs/` — roadmap, setup guides, CI guide, next steps
- `src-tauri/` — Rust backend
  - `src-tauri/src/commands/` — Tauri `#[tauri::command]` handlers (currently `projects.rs`)
  - `src-tauri/src/domain/` — pure-Rust domain types and validation (currently `project.rs`)
  - `src-tauri/src/lib.rs`, `src-tauri/src/main.rs` — entry points
  - `src-tauri/capabilities/default.json` — Tauri 2 capability set
  - `src-tauri/tauri.conf.json` — window, bundle, security config
- `.github/workflows/` — `ci.yml`, `release.yml`
- `.claude/` — Claude-specific settings and path-scoped rules (see `CLAUDE.md`)

## Commands

Use Bun. Every script in `package.json` is runnable via `bun run <script>` (or directly: `bunx vite`, etc.). The `scripts` block still spells out `npm run …` internally for Tauri-CLI compatibility but Bun executes them fine.

Verified scripts (from `package.json`):

```bash
bun install                # install deps
bun run dev                # vite dev server, host 0.0.0.0:1420
bun run build              # tsc -b && vite build
bun run preview            # vite preview on :4173
bun run lint               # eslint .
bun run format             # prettier --write .
bun run format:check       # prettier --check .
bun run typecheck          # tsc --noEmit (app + node configs)
bun run test               # vitest run
bun run test:watch         # vitest

bun run rust:fmt           # cargo fmt --manifest-path src-tauri/Cargo.toml -- --check
bun run rust:clippy        # cargo clippy --all-targets -D warnings
bun run rust:test          # cargo test
bun run rust:check         # fmt + clippy + test

bun run tauri:dev          # tauri dev
bun run tauri:build        # tauri build

bun run ci:check           # lint + format:check + typecheck + test + build + rust:check
```

Direct Rust commands (from `src-tauri/`):

```bash
cargo test --manifest-path src-tauri/Cargo.toml
cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets -- -D warnings
cargo fmt --manifest-path src-tauri/Cargo.toml
```

**Do not invent scripts.** If a command is not in `package.json` or `Cargo.toml`, do not assume it exists.

## Coding Conventions

- **TypeScript:** strict mode is on via project references (`tsconfig.app.json`, `tsconfig.node.json`). Prefer named exports; avoid `any`; lean on Zod schemas in `features/*/` for runtime validation at boundaries.
- **React:** React 19 function components. Hooks per `eslint-plugin-react-hooks`. Keep components colocated with the feature they belong to (`src/features/<feature>/`); only promote to `src/components/` when truly reused.
- **State:** Zustand for app-level stores (see `src/features/projects/project-store.ts` pattern). Local state stays local. Forms use React Hook Form + Zod resolver.
- **Routing:** `react-router-dom` v6 declarative routes (see `src/app/App.tsx`).
- **Imports:** keep them grouped by external → internal → relative; let ESLint/Prettier do the rest. No barrel files unless one already exists in that feature.
- **File naming:** kebab-case for files (`project-progress.ts`), PascalCase for React components (`ProjectShell.tsx`), camelCase for variables/functions.
- **Styling:** design tokens in `src/styles/tokens.css`, consumed via CSS custom properties. `clsx` for conditional classes. No CSS-in-JS library.
- **Prettier:** `semi: true`, `singleQuote: false` (double quotes), `trailingComma: "none"`. LF line endings (enforced via `.gitattributes`).
- **Rust:** edition 2021, `cargo fmt` clean, `clippy -D warnings`. Domain logic in `src-tauri/src/domain/`, IPC handlers in `src-tauri/src/commands/`. Keep handlers thin; push validation and IO into domain modules and helpers.

## Frontend Rules

- Edit `src/features/<feature>/` for feature-scoped work. Don't dump cross-feature logic into `src/components/`.
- Reuse layout primitives in `src/components/layout/` (`AppScaffold`, `AccountMenu`, etc.) rather than rebuilding chrome.
- The project shell at `src/features/workspace/ProjectShell.tsx` owns its own header + progress strip — don't render `AppScaffold` chrome inside a `/workspace/*` route.
- Progress / status derivation belongs in `src/features/projects/project-progress.ts` (single source of truth for step states). Don't recompute status ad hoc inside components.
- Persisted project shape is the contract between the frontend store and the Rust backend. Coordinate any change to that shape across `src/types/domain.ts`, `src/features/projects/project-service.ts`, `src/features/projects/project-store.ts`, and `src-tauri/src/domain/project.rs` in the same PR.
- Don't introduce a new state manager, UI framework, or styling system without explicit approval.

## Tauri / Rust Rules

- Tauri commands live in `src-tauri/src/commands/` and are registered in `src-tauri/src/lib.rs`. Add commands by extending the existing `mod.rs` pattern; do not scatter `#[tauri::command]` across unrelated files.
- Validation and IO live in `src-tauri/src/domain/`. Project IDs go through the hardened validator in `domain/project.rs` (rejects path traversal, control chars, unsafe characters). Reuse it; don't bypass it.
- Filesystem writes must be atomic (temp-file + rename). The existing project writer is the reference.
- **Do not weaken `src-tauri/capabilities/default.json` permissions** beyond what a specific feature needs, and never add `fs:allow-*` patterns that resolve to user-controlled paths without explicit approval.
- **Do not modify `src-tauri/tauri.conf.json` `security.csp` casually.** The roadmap (P0) calls for replacing `csp: null` with a desktop-appropriate CSP before any signed release — that change needs deliberate review, not a drive-by.
- Keep the frontend/backend boundary serde-friendly: JSON-serializable types, no Rust-only enums leaking to TS without a mirror in `src/types/domain.ts`.
- When the frontend needs new data, prefer extending an existing command's response over inventing a chatty new one.

## Catalog Rules

- `catalog/controllers/*.json` and `catalog/components/*.json` are loaded by `src/features/catalog/` at runtime. The shape is enforced both by the loader (TS) and by Rust validation when projects reference catalog IDs.
- One file per part. File name is the controller/component `id` in kebab-case.
- Controller files must include: `id`, `name`, `packageName`, `voltage`, `protocols`, `interfaces[]` with `signalPins[]`.
- Component files must include the supported `protocols` and any signal metadata referenced by the connection planner.
- When you change the catalog schema:
  1. Update the TS types in `src/types/domain.ts` (and any Zod schema in `src/features/catalog/`).
  2. Update the Rust validation in `src-tauri/src/domain/`.
  3. Add or update tests covering the new field.
  4. Migrate every existing JSON file in the catalog; don't leave half-migrated files.
- Adding a new part is a normal contribution; **changing schema is not** — flag schema changes explicitly in the PR description.

## Design File Rules

- `design-files/PLAN.md` is the product definition for the v0.1 UI. The five `*_standardized_navigation/` subdirectories hold per-page UX references and `logic_foundry/` holds the broader design language.
- Treat these files as authoritative for UI structure and naming (sidebar items, page titles, step order, status badges). Implementation should stay consistent with them.
- Before a large UI or navigation change, read the relevant subdirectory in `design-files/` and the matching feature in `src/features/workspace/` or `src/features/projects/`.
- Design files are **not** generated junk. Do not delete or "clean up" anything under `design-files/` without explicit instruction.
- If the implementation has knowingly diverged from the design (the roadmap "Where we are honest about gaps" section enumerates these), don't silently revert one or the other — surface the divergence in your PR.

## Testing and Validation

Run the relevant subset for the change you made, in this order:

1. `bun run typecheck` — fast, catches most regressions.
2. `bun run lint` — flat-config ESLint.
3. `bun run test` — Vitest (jsdom, setup in `src/app/test-setup.ts`).
4. `bun run rust:test` — when you touched `src-tauri/`.
5. `bun run rust:clippy` and `bun run rust:fmt` — when you touched Rust.
6. `bun run build` — when you touched build config, types crossing module boundaries, or the Vite entry.
7. `bun run tauri:build` — only when explicitly requested or when changing Tauri bundle/security config. Slow; needs OS prerequisites.

`bun run ci:check` runs the full local gate.

Vitest excludes `.claude/**` and `dist/`. ESLint ignores `.claude`, `dist`, `coverage`, `src-tauri/target`, `src-tauri/gen`.

## Security Rules

- Never read, print, log, or commit `.env*` files, credentials, signing keys, or tokens.
- Never weaken Tauri capabilities or CSP without explicit, written approval — both are intentional security boundaries.
- Avoid destructive shell commands (`rm -rf`, `git reset --hard`, `git push --force`, branch deletion) unless the user explicitly asks. When in doubt, propose and wait.
- Do not add a dependency that ships binaries, runs postinstall scripts, or pulls native code without flagging it.
- When changing serialization at the IPC boundary, assume untrusted input from the frontend and validate on the Rust side (the existing project-id validator is the pattern).
- Do not upload repository code, catalog data, or screenshots to third-party services as part of routine work.

## Change Workflow

1. Read relevant files first (use `Read`, `Grep`, `Glob`; don't guess).
2. For multi-step work, write a short plan or use the todo tracker.
3. Make minimal focused edits. Don't ride-along refactors into a feature PR.
4. Run the targeted validation commands listed above.
5. In the PR / response, state:
   - what changed, in one or two sentences
   - which validation commands ran and their result
   - which commands you skipped and why
   - any doc that needs updating (`docs/roadmap.md`, setup guides, this file)

## Do Not Do

- Don't rewrite the architecture (state manager, routing, styling, IPC pattern) without explicit approval.
- Don't add a dependency without a one-line justification of why an existing tool can't cover it.
- Don't duplicate instructions between `AGENTS.md`, `CLAUDE.md`, and `.claude/rules/`. `AGENTS.md` is the source of truth; the others link or extend.
- Don't edit `bun.lock` by hand. Let Bun manage it; commit the result.
- Don't touch generated/build artifacts (`dist/`, `src-tauri/target/`, `src-tauri/gen/`, `coverage/`).
- Don't produce broad formatting-only diffs unless explicitly asked — Prettier + LF is already enforced by `.gitattributes` and the `format:check` script.
- Don't fork the project shape between the TS and Rust sides. Keep `src/types/domain.ts` and `src-tauri/src/domain/` aligned.
- Don't treat the roadmap's "Out of scope for v0.1" list as suggestions: schematic editing, multi-user/cloud, real auth, and theme variants beyond dark are all explicitly deferred.
