# KiForge Roadmap

Last reviewed: 2026-05-19

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

## Where we are honest about gaps

Some things look done in the UI but aren't actually wired up. These are intentional placeholders, not bugs to file separately — they're tracked in the priorities below.

- Search inputs in the top toolbar (every page) accept input but do not filter anything.
- "Theme" pills in Settings persist a preference but the app always renders dark.
- "Sign out" in the account menu shows a notice that the app runs locally — no auth.
- "Pin mapping" and "Validation" progress steps point at `/workspace/connections` and `/workspace/overview` respectively. They're not standalone screens yet.
- "Export" progress step turns complete when an export result exists, but there's no in-shell export action — export still happens from the project card on `/projects`.
- The project shell does not have a dedicated inspector slot, so the connections page renders its inspector panels inline above the planner.

## Priorities

### P0: Make the planner trustworthy

These are the gaps where the app currently lies — looks like it's doing work but isn't.

- Stand up a real export action inside the project shell, gated on `Ready to Generate` status, that re-uses the existing desktop bundle command and reflects success in the Export step card.
- Make `Ready to Generate` / `Generated` statuses reachable from real state, not just from user-edited values. Status should be derived from `getProjectProgress` + last-export timestamp.
- Add an inspector slot to `ProjectShell` and move the connection inspector panels into it. The current inline layout works but eats vertical real estate.
- Replace `csp: null` in `src-tauri/tauri.conf.json` with a desktop-appropriate CSP before any signed release.
- Edit project identity (description, controller, voltage domain) from inside the shell. Today only rename is reachable, and only from the project card.

### P1: Validation depth

Right now validation tracks "unconnected device" and "conflicting pin assignment within one connection." That is not enough to call this a planner.

- Voltage domain mismatches between a device's supply requirements and the project's voltage domain.
- I2C address conflicts once catalog entries carry addresses.
- Boot / debug / strapping pin warnings on the chosen controller (reserved GPIOs that shouldn't be reassigned).
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

We have iterated through several rounds of parallel work (foundation / UI / shell). For the next round the cleaner split is by user-visible step rather than by file ownership:

- **Validation work** stays on the connections + planner files.
- **Identity + export polish** lives on the project shell + new export view.
- **Package preview** is a new component and a new visual primitive; it can land independently.
- **Catalog growth** is data + a schema validator; isolated from the rest.

When work cuts across these, batch it in a single PR rather than splitting for the sake of splitting — the merge cost of three-way splits with shared base ref drift is real.
