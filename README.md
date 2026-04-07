# KiForge

KiForge is a Tauri v2 + React desktop application for planning hardware projects before KiCad. The MVP focuses on project setup, component selection, logical connection planning, and guided pin assignment.

## Current status

This repository now contains the initial application scaffold:

- React + Vite + TypeScript frontend
- Tauri v2 backend skeleton
- Design-token driven desktop layout
- Mocked project, component, and connection data
- Linting, formatting, testing, and CI workflow stubs

The local environment used for scaffolding had `node` and `npm`, but not `cargo` or `rustc`, so dependency installation and native build verification were not run here.

## Scripts

- `npm run dev`: start the Vite frontend on port `1420`
- `npm run build`: run TypeScript checks and build the frontend
- `npm run lint`: run ESLint
- `npm run test`: run Vitest
- `npm run tauri:dev`: start the Tauri desktop app
- `npm run tauri:build`: build desktop bundles
- `npm run ci:check`: run the main quality gate locally

## First commands to run locally

1. Install the OS prerequisites from the setup guide for your platform.
2. Install project dependencies with `npm install`.
3. Start the web app with `npm run dev`.
4. After Rust is installed, start the desktop app with `npm run tauri:dev`.

## Guides

- [Windows setup](./docs/setup-windows.md)
- [macOS setup](./docs/setup-macos.md)
- [Linux setup](./docs/setup-linux.md)
- [CI/CD guide](./docs/ci-cd.md)
