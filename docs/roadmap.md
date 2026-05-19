# KiForge Roadmap

Last reviewed: 2026-05-14

## Product Goal

KiForge is a Tauri v2 + React desktop workspace for planning hardware projects before KiCad. The MVP should help a user create a project, choose a controller, add devices, define logical connections, assign pins, inspect validation issues, and export a starter project bundle.

## Current Baseline

- React + Vite + TypeScript frontend with Tauri v2 desktop shell.
- Filesystem-backed project CRUD in desktop mode.
- Browser `localStorage` fallback for web preview.
- JSON-backed local controller and component catalog.
- Project, component, and connection pages wired to persisted workspace state.
- Interactive connection planner with protocol selection, controller interface selection, shared-bus behavior, auto-assignment, saved edits, and derived validation.
- Basic unit/component tests for app boot, catalog loading, browser persistence, and planner behavior.

## Known Gaps

### P0: Safety and Release Blockers

- Harden Tauri project id validation. Current backend checks only non-empty ids before building filesystem paths.
- Add atomic project writes to reduce corruption risk.
- Add backend schema/enum validation so malformed frontend data cannot be persisted blindly.
- Replace `csp: null` with a real desktop CSP before release.
- Make formatting gates pass: `npm run format:check` and `cargo fmt --check` currently fail.

### P1: Export and MVP Usefulness

- Wire the existing desktop `export_project` command into the frontend service/store/UI.
- Generate a starter output bundle, not only one project JSON file.
- Include at minimum:
  - project manifest
  - controller summary
  - component inventory/BOM
  - connection table
  - pin assignment report
  - validation issue report
- Make `Ready to Generate` and `Generated` statuses reachable through real validation/export state.

### P2: Planner and Validation Depth

- Surface project-level issue summary in the workspace, not only draft-level issues.
- Add validation for:
  - voltage domain mismatches
  - I2C address conflicts once catalog supports addresses
  - boot/debug reserved pins
  - controller alternate-function ambiguity
  - missing optional-but-recommended signals
- Improve planner UX:
  - top validation counters
  - validate action
  - alerts panel
  - package/pin preview
  - pin usage progress

### P3: Design Parity

- Repo has static design exports under `design-files/*`, but no editable `.fig` or Figma URL.
- Current UI partially follows design but misses:
  - icon-driven nav/actions
  - settings/help actions
  - real search/filter behavior
  - project add card and recent activity area
  - BOM-style right rail on components page
  - denser connection planner layout
  - package preview and pin usage visualization
  - bottom status strip

### P4: Domain Model Growth

- Expand catalog schema with manufacturer part numbers, datasheets, footprints, package pin metadata, supply ranges, current estimates, and I2C addresses.
- Add component instance editing: refdes, alias, protocol preference, notes, remove.
- Add controller/package metadata needed for realistic pin previews and KiCad starter output.
- Keep schematic editing out of scope until planner and export are stable.

## Parallel Engineer Split

### Engineer A: Backend Safety and Export

Ownership:

- `src-tauri/src/domain/project.rs`
- `src-tauri/src/commands/projects.rs`
- `src-tauri/src/lib.rs`

Goals:

- Harden project id/path handling.
- Add atomic project writes.
- Expand export from one JSON file into a starter bundle.
- Add Rust tests for path rejection, duplicate/export behavior, and manifest output.

### Engineer B: Frontend Export Flow

Ownership:

- `src/features/projects/project-service.ts`
- `src/features/projects/project-store.ts`
- `src/features/projects/ProjectsPage.tsx`
- `src/types/domain.ts`

Goals:

- Add `exportProject` to the frontend service/store.
- Expose export on project cards.
- Show success/error state with exported path in desktop mode.
- Keep browser fallback behavior explicit.

### Engineer C: Planner Validation UI

Ownership:

- `src/features/connections/ConnectionsPage.tsx`
- `src/features/connections/planner.ts`
- `src/features/connections/planner.test.ts`

Goals:

- Add project-level validation summary on the connections page.
- Add counters for connected devices, unresolved issues, conflicts, and optional signals.
- Add tests for unresolved/missing/conflict summaries.

### Engineer D: Design and Navigation Polish

Ownership:

- `src/components/layout/*`
- `src/components/ui/*`
- `src/data/navigation.ts`
- `src/styles/index.css`
- `src/styles/tokens.css`

Goals:

- Bring app frame closer to static design exports.
- Add icon-aware nav/action structure without making placeholder routes look real.
- Tighten density, button radius, panel styling, and status-strip patterns.
- Keep CSS responsive and avoid layout overlap.

### Engineer E: CI and Formatting

Ownership:

- `.github/workflows/ci.yml`
- `.github/workflows/release.yml`
- `package.json`
- `prettier.config.mjs`
- `eslint.config.js`
- docs under `docs/`

Goals:

- Add Rust fmt, clippy, and cargo test to CI.
- Decide whether design export HTML/Markdown should be formatted or ignored.
- Make local `ci:check` match CI.
- Document the quality gate.

## Suggested Delivery Order

1. Land P0 safety and clean gates first.
2. Land export bundle plus frontend export action.
3. Land planner validation summary and issue UX.
4. Land design polish and navigation behavior.
5. Expand catalog/domain model after export format stabilizes.

## Exit Criteria for MVP

- User can create/open/delete/duplicate projects in desktop mode.
- User can add components from local catalog.
- User can define SPI or I2C connections with explicit pin assignment.
- User can see unresolved pins, conflicts, and project-level validation state.
- User can export a starter bundle from desktop mode.
- CI passes frontend checks, Rust checks, tests, and Tauri build smoke.
