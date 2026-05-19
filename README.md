# KiForge

KiForge is a Tauri v2 + React desktop application for planning hardware projects before KiCad. The MVP focuses on project setup, component selection, logical connection planning, and guided pin assignment.

## Current status

This repository now contains the scaffold plus the first persistence pass:

- React + Vite + TypeScript frontend
- Tauri v2 backend with filesystem-backed project commands
- design-token driven desktop layout
- persisted project CRUD wired into the frontend store
- local JSON catalog under `catalog/controllers` and `catalog/components`
- browser fallback storage for web preview
- linting, formatting, testing, and CI workflow stubs

## Persistence model

- Desktop mode uses Tauri commands backed by the resolved app data directory.
- Project files are stored as `projects/<project-id>/project.json` under that app data root.
- Web preview uses browser `localStorage` as a fallback so the app can run without the native shell.
- Controller and component definitions now load from local JSON catalog files instead of `src/data/mockData.ts`.

## Scripts

The canonical package manager is [Bun](https://bun.sh). `bun.lock` is the lockfile.

- `bun run dev`: start the Vite frontend on port `1420`
- `bun run build`: run TypeScript checks and build the frontend
- `bun run lint`: run ESLint
- `bun run test`: run Vitest
- `bun run tauri:dev`: start the Tauri desktop app
- `bun run tauri:build`: build desktop bundles
- `bun run ci:check`: run the main quality gate locally

## First commands to run locally

1. Install the OS prerequisites from the setup guide for your platform (includes installing Bun).
2. Install project dependencies with `bun install`.
3. Start the web app with `bun run dev`.
4. After Rust is installed, start the desktop app with `bun run tauri:dev`.

## Verification

- `bun run typecheck`
- `bun run test`
- `bun run lint`
- `bun run build`
- `cargo test --manifest-path src-tauri/Cargo.toml`

## Guides

- [Implementation next steps](./docs/next-steps.md)
- [Windows setup](./docs/setup-windows.md)
- [macOS setup](./docs/setup-macos.md)
- [Linux setup](./docs/setup-linux.md)
- [CI/CD guide](./docs/ci-cd.md)
