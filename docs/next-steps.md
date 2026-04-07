# Implementation Next Steps

This document compresses the immediate implementation path after the persistence and catalog pass.

## Current baseline

The repository now has:

- Tauri v2 desktop shell
- React + Vite + TypeScript frontend
- desktop layout and design tokens
- persisted project CRUD through Tauri commands
- browser fallback storage for web preview
- JSON-backed controller and component catalogs
- project, component, and connection pages wired to the persisted workspace store
- setup docs and CI/release workflow stubs

## Build order

1. Build the connection editor flow:
   - choose controller and peripheral
   - choose protocol
   - choose controller interface instance
   - assign pins
   - configure shared bus behavior
   - save and edit the connection
2. Add validation:
   - incompatible protocol detection
   - pin conflict detection
   - shared bus rules for SPI and I2C
   - missing required signal detection
3. Add output generation for the MVP:
   - export project JSON
   - export a starter output folder structure
   - keep full KiCad generation out of scope until the planner is stable
4. Tighten quality gates:
   - switch CI from `npm install` to `npm ci`
   - add Rust fmt, clippy, and tests
   - add desktop smoke tests once the connection flow is interactive

## Completed foundation

### 1. Persistence

- app data directory resolution
- `projects/<project-id>/project.json`
- create/load/save/rename/duplicate/delete/export commands
- frontend data service that calls Tauri in desktop mode and uses a browser fallback in web preview

### 2. Catalog

- `catalog/controllers/*.json`
- `catalog/components/*.json`
- typed loaders and validation
- protocol and pin-capability metadata needed by the planner

### 3. Workspace wiring

- persisted frontend workspace store
- project creation wired from the form
- component adds saved back into the active project
- connection page reading saved project data instead of inline mocks

## Immediate priorities

### 1. Connection planner

Turn the current persisted connections page into the interactive MVP workflow.

Deliverables:

- selected device context
- protocol compatibility computation
- interface availability computation
- signal-to-pin candidate list
- explicit auto-assign action
- editable review/save cycle

### 2. Validation and export

The app becomes useful only when it can explain what is valid, what conflicts, and what can be exported.

Deliverables:

- warning and error model
- validation summary in the workspace
- richer export command and basic output manifest

## Files to touch next

- `src/features/projects/project-store.ts`
- `src/features/projects/project-service.ts`
- `src/features/catalog/catalog.ts`
- `src/features/projects/*`
- `src/features/components/*`
- `src/features/connections/*`
- `src-tauri/src/commands/projects.rs`
- `src-tauri/src/domain/project.rs`
- `src-tauri/src/lib.rs`

## Constraints

- Keep the MVP focused on project definition, not schematic editing.
- Keep all automatic decisions explicit in the UI.
- Preserve the desktop three-panel workflow from the design files.
- Prefer deterministic validation rules over speculative "smart" behavior.

## Exit criteria for the next implementation phase

The next phase is complete when a user can:

1. Create a project and persist it locally.
2. Add components from a local catalog.
3. Define at least one SPI or I2C connection through the guided flow.
4. See pin conflicts and unresolved signals in the UI.
5. Export a project definition bundle from the desktop app.
