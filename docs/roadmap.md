# KiForge Roadmap

Last reviewed: 2026-05-19 (post KiCad parser + CSP + first validation rule)

## Product goal

KiForge is a Tauri v2 + React desktop workspace for planning hardware projects before opening KiCad. A user should be able to start a project, pick a controller, add devices, plan logical connections with explicit pin mapping, see validation issues surfaced, and export a starter project bundle — all without leaving the app and without committing to a schematic.

The first usable build (v0.1) targets one happy-path user: someone planning a small board around a supported MCU, using the curated catalog, exporting a JSON bundle they can hand off to their next tool.

## Current baseline (post 2026-05-19 merge)

### Shell and navigation

- Outer shell (`/projects`, `/templates`, `/settings`, `/projects/new`) renders with `AppScaffold` — sidebar + topbar + optional inspector.
- Project shell (any `/workspace/*` route) renders with [ProjectShell](../src/features/workspace/ProjectShell.tsx) — its own header (project meta + Save + Back-to-Projects), a sticky [ProjectProgressStrip](../src/features/workspace/ProjectProgressStrip.tsx) with per-step status, and `<Outlet />` for the active step. Outer chrome is hidden inside the shell.
- Account dropdown ([AccountMenu](../src/components/layout/AccountMenu.tsx)) replaces the static avatar.

### Project lifecycle

- Filesystem-backed CRUD on desktop, `localStorage` fallback on web.
- Project creation flow (with optional template pre-fill) — [NewProjectPage](../src/features/projects/NewProjectPage.tsx).
- Curated [starter templates](../src/features/templates/templates-catalog.ts) at `/templates` that pre-select controller + voltage domain + suggested devices.
- Settings store persisted to `localStorage` ([settings-store](../src/features/settings/settings-store.ts)) — display name, theme, default voltage / output target, behavior toggles.
- Project list with All / Recent / Ready-to-generate filters, status legend, export-result toast.

### Workspace steps

- **Overview** (`/workspace/overview`): [getProjectProgress](../src/features/projects/project-progress.ts) drives step cards (Identity / Components / Connections / Pin mapping / Validation / Export) with `complete` / `attention` / `empty` / `blocked` states and a "Resume {next step}" CTA. 11 unit tests cover step semantics.
- **Components** (`/workspace/components`): catalog browser + project inventory panel with inline rename (commit on blur/Enter) and ghost Remove button. `removeComponentFromCurrentProject` also strips dependent connection records.
- **Connections** (`/workspace/connections`): interactive planner with protocol selection, controller interface selection, dedicated/shared bus modes, signal-by-signal pin assignment, optional-signal toggles, auto-assign, project-level validation summary, and a planner-row breakdown of derived status.

### Backend

- Tauri 2.11.1 + tauri-build 2.6.2.
- Hardened project id validation in [src-tauri/src/domain/project.rs](../src-tauri/src/domain/project.rs) (rejects path traversal, control chars, and unsafe characters).
- Atomic project writes via temp-file + rename.
- Backend schema/enum validation so malformed frontend data cannot be persisted.
- Project export bundle (manifest + project document) covered by Rust tests.

### Build and CI

- Frontend runs on Vite + TypeScript + React.
- CI uses bun for frontend install + scripts; PR matrix covers Ubuntu / macOS / Windows for lint, format, typecheck, test, build, plus Rust fmt / clippy / tests.
- Desktop bundle smoke step removed from PR CI — `release.yml` (manual `workflow_dispatch` or `app-v*` tag) owns bundling.
- `.gitattributes` pins `text=auto eol=lf` so Windows checkouts don't trip prettier.
- `bun.lock` is the canonical lockfile; `package-lock.json` removed.
- CI `paths-ignore` skips the full matrix for docs- and AI-config-only PRs (`docs/**`, `**/*.md`, `.claude/**`, `.agents/**`, `.gitignore`, `.gitattributes`, `LICENSE`). Mixed PRs still run.
- Top-level `permissions: contents: read` in `.github/workflows/ci.yml` (CodeQL hardening).
- Bun toolchain version pins: `@tauri-apps/api ^2.11.0` and `@tauri-apps/cli ^2.11.2` match the Rust `tauri = 2.11.x` crate (lockfile-resolved). Tauri config `beforeDevCommand` / `beforeBuildCommand` run via `bun run *` so bun-only machines aren't blocked on `npm`.

### KiCad file format support

- [src/lib/kicad/](../src/lib/kicad/) — pure-TS layer on top of the parser AST:
  - `sexpr.ts` — tokenizer + recursive-descent parser for KiCad's S-expression dialect; typed AST (atom / string / list) with per-node source positions.
  - `kicad-pro.ts` — typed reader for `.kicad_pro` JSON (KiCad 6.0+), validates `meta.version`; rest pass-through.
  - `builder.ts` — node constructors plus `schematicHeader()` for assembling an AST from project state.
  - `stringify.ts` — KiCad-style serializer (tab indent, head-on-opening-paren multi-line, leaf-only single-line). Round-trips through `parse` for any AST.
  - `schematic.ts` — typed semantic view: `Schematic`, `SchematicSymbol`, `SchematicWire`; readers + symmetric builders (`symbolNode`, `wireNode`).
  - Fixtures: `minimal.kicad_sch`, `strings-and-escapes.kicad_sch`, `with-symbol-and-wire.kicad_sch`, `minimal.kicad_pro`.
- [src/features/export/build-kicad-bundle.ts](../src/features/export/build-kicad-bundle.ts) — `buildKicadBundle(project)` returns an in-memory files map (`<id>.kicad_sch` + `<id>.kicad_pro`). The schematic is intentionally empty (header only) for now — KiCad opens it; symbol placement lands when the bundle calls into the semantic layer.

### Validation

- [src/features/connections/voltage-validation.ts](../src/features/connections/voltage-validation.ts) — `parseVoltageRange` covers every catalog voltage string format currently in use; `validateVoltageCompatibility(project)` returns warning issues for components whose supply range excludes the project domain. Mixed / Undecided domains skip the check entirely. Pure-logic, not yet wired into `applyDerivedProjectState`.

### Status derivation

- [src/features/projects/project-progress.ts](../src/features/projects/project-progress.ts) — `deriveProjectStatus(progress, hasExported)` returns the right `ProjectStatus` badge from real progress (any step blocked → Has Conflicts; all complete + exported → Generated; etc). Pure function. Not yet wired into the projects list / cards — UI still reads the stored `ProjectDocument.status`.

### Security

- `src-tauri/tauri.conf.json` `security.csp` is a strict object policy for production builds; `devCsp: null` keeps Vite HMR + React DevTools working under `tauri dev`. See [chore(security) PR #17](https://github.com/joaomnuno/KiForge/pull/17) for directive-by-directive rationale.
- `src-tauri/capabilities/default.json` still grants only `core:default` — no `fs:*`, `shell:*`, `http:*`, or notification plugins.

## Where we are honest about gaps

Some things look done in the UI but aren't actually wired up. These are intentional placeholders, not bugs to file separately — they're tracked in the priorities below.

- Search inputs in the top toolbar (every page) accept input but do not filter anything.
- "Theme" pills in Settings persist a preference but the app always renders dark.
- "Sign out" in the account menu shows a notice that the app runs locally — no auth.
- "Pin mapping" and "Validation" progress steps point at `/workspace/connections` and `/workspace/overview` respectively. They're not standalone screens yet.
- "Export" progress step turns complete when an export result exists, but there's no in-shell export action — export still happens from the project card on `/projects`. The KiCad bundle assembler (`buildKicadBundle`) is on disk but no UI button or Tauri write command calls it yet.
- The project shell does not have a dedicated inspector slot, so the connections page renders its inspector panels inline above the planner.
- `deriveProjectStatus` exists and is unit-tested but the projects list / project card still display the stored `ProjectDocument.status` (user-editable). Wiring is queued in P0 below.
- `validateVoltageCompatibility` exists and is unit-tested but is not invoked by `applyDerivedProjectState` — the warning does not appear on the Validation step or in the project summary yet.

## Priorities

### P0: Make the planner trustworthy

These are the gaps where the app currently lies — looks like it's doing work but isn't.

- [x] ~~Replace `csp: null` in `src-tauri/tauri.conf.json` with a desktop-appropriate CSP before any signed release.~~ Done — strict prod CSP + `devCsp: null`.
- **Stand up a real export action inside the project shell**, gated on `Ready to Generate` status, that reflects success in the Export step card. Two slices queued:
  1. `feat/kicad-bundle-place-controller` — extend `buildKicadBundle` to use `symbolNode` and place the project's controller (and eventually peripherals) instead of emitting an empty schematic.
  2. `feat/kicad-export-tauri-command` — Rust command that accepts the bundle map from `buildKicadBundle` and writes each entry atomically next to `project.json`, reusing the existing project-id validator.
  3. `feat/project-shell-export-wire-ui` — project-shell Export button gated on `Ready to Generate`; toast + Export step card on success.
- **Make `Ready to Generate` / `Generated` statuses reachable from real state.** The pure derivation (`deriveProjectStatus`) is in place. Remaining:
  1. `feat/project-last-exported-at` — add `lastExportedAt: Option<String>` field to `ProjectDocument` (TS + Rust together, per AGENTS.md catalog/schema rule); the export command sets it before save.
  2. Same PR or follow-up: swap stored status for `deriveProjectStatus(getProjectProgress(project), Boolean(project.lastExportedAt))` in the projects list, the project card, and the project shell header.
- Add an inspector slot to `ProjectShell` and move the connection inspector panels into it. The current inline layout works but eats vertical real estate.
- Edit project identity (description, controller, voltage domain) from inside the shell. Today only rename is reachable, and only from the project card.

### P1: Validation depth

Right now validation tracks "unconnected device" and "conflicting pin assignment within one connection." That is not enough to call this a planner.

- [x] ~~Voltage domain mismatches between a device's supply requirements and the project's voltage domain.~~ Pure function landed (`validateVoltageCompatibility`). Still needs `feat/validation-wire-into-planner` to invoke it from `applyDerivedProjectState` so warnings surface in the Validation step and project summary.
- I2C address conflicts once catalog entries carry addresses. Blocked on catalog schema: add `i2cAddress?: string` to component JSON entries + TS types + Rust validation + migrate all 5 existing component files. Once the field exists, the validator is a one-page module similar to `voltage-validation.ts`.
- Boot / debug / strapping pin warnings on the chosen controller (reserved GPIOs that shouldn't be reassigned). Blocked on controller catalog schema: add a `reservedPins[]` (or `pinRoles{}`) field.
- Controller alternate-function ambiguity (when a pin can serve multiple peripheral roles and we picked one implicitly).
- Missing optional-but-recommended signals (reset on flash, INT on IMU, etc.) flagged at warning severity.

### P2: Pin and package visualization

The planner gets dramatically more useful when the user can see what the chip looks like.

- Package preview on the controller (QFP / QFN / BGA pinout with assigned signals annotated).
- Pin usage progress meter (assigned vs available, per peripheral class).
- Bottom status strip showing aggregate progress + last-save timestamp + export state.
- Inline alerts panel surfaced from validation, with click-to-jump-to-the-relevant-step.

### P3: Catalog growth

The MVP catalog is curated and intentional, but it's small.

- Schema: manufacturer part numbers, datasheets, footprints, package pin metadata, supply ranges, current estimates, I2C addresses.
- Tooling: a `catalog/validate` script so future contributions don't drift from the schema.
- More controllers (ESP32-S3, STM32G0, RP2350) and more devices (display drivers, common power management ICs).

### P4: Web-vs-desktop honesty

The frontend silently falls back to `localStorage` on web preview. That is fine for demos and wrong for anything real.

- Disable destructive workflows (export, save-to-disk) in web preview with a clear "desktop only" affordance instead of silent fallback.
- Surface the runtime mode (already shown in the toolbar pill) in a more prominent place when in web preview, ideally with a single "Open desktop app" CTA.

## Out of scope for v0.1

Tracked here so contributors don't quietly start them.

- Schematic editing inside KiForge. The contract is: plan in KiForge, hand the bundle to KiCad.
- Multi-user / cloud projects. Persistence is local-only.
- Real authentication. The account menu is decorative.
- Theme variants beyond dark. Light mode and OS-following are P3 polish at the earliest.

## Exit criteria for v0.1

- Open the app, create a project from blank or from a template.
- Add devices from the catalog, name them, remove them.
- Plan SPI / I2C / UART connections with explicit pin assignment, including shared-bus modes.
- See `Ready to Generate` status reached from real validation, not from a manual edit.
- Export a starter bundle (manifest + project JSON, with room for more files) to disk on desktop.
- Land the changes in main with CI green across Ubuntu / macOS / Windows.

## Delivery notes

We have iterated through several rounds of parallel work (foundation / UI / shell / KiCad format). For the next round the cleaner split is by user-visible step rather than by file ownership:

- **Validation work** stays on the connections + planner files.
- **Identity + export polish** lives on the project shell + new export view.
- **Package preview** is a new component and a new visual primitive; it can land independently.
- **Catalog growth** is data + a schema validator; isolated from the rest.

When work cuts across these, batch it in a single PR rather than splitting for the sake of splitting — the merge cost of three-way splits with shared base ref drift is real.

## Queued next slices

In rough priority order. Each is a single branch / single focused PR.

1. **`feat/kicad-bundle-place-controller`** — extend `buildKicadBundle` to call `symbolNode` for the project's controller (and add an empty `lib_symbols` entry for it). First user-visible result: the exported `.kicad_sch` carries the MCU instead of being header-only.
2. **`feat/kicad-export-tauri-command`** — Rust command that accepts the bundle map + atomically writes each entry under `projects/<id>/kicad/`. Reuses the existing project-id validator and atomic temp+rename pattern. Frontend `project-service` wrapper invokes it.
3. **`feat/project-shell-export-wire-ui`** — Export button in the project shell header, gated on `Ready to Generate`. Toast on success. The Export step card flips to `complete` via the existing `exportResult` plumbing. Uses #1 + #2.
4. **`feat/project-last-exported-at`** — schema bump: `lastExportedAt: Option<String>` on `ProjectDocument` across TS + Rust (per AGENTS.md catalog/schema rule); set by the export command before save. Same PR swaps the stored status for `deriveProjectStatus(...)` in the projects list / card / shell header.
5. **`feat/validation-wire-into-planner`** — invoke `validateVoltageCompatibility` from `applyDerivedProjectState` so warnings surface in the Validation step and the project summary. Also lands the `i2cAddress?: string` schema field across TS + Rust + catalog JSON migrations + an `I2C-address conflict` rule in the same shape as the voltage rule.
6. **`feat/project-shell-inspector-slot`** — add a dedicated inspector slot to `ProjectShell` and move the connection inspector panels into it. Pure refactor of where things live.
7. **`feat/project-shell-edit-identity`** — let users edit description / controller / voltage domain from inside the shell (today only rename, only from the project card).
