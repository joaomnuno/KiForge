# CI/CD Guide

## Goals

The initial pipeline should enforce:

- formatting and lint checks
- TypeScript validation
- unit and component tests
- frontend production build
- native Tauri build smoke tests on Windows, macOS, and Linux

## Continuous Integration

The scaffold includes a GitHub Actions workflow at `.github/workflows/ci.yml`.

It runs on:

- `ubuntu-22.04`
- `macos-latest`
- `windows-latest`

Each job performs:

1. repository checkout
2. Node setup
3. Rust setup
4. Linux system dependency installation where needed
5. `npm install`
6. `npm run lint`
7. `npm run typecheck`
8. `npm run test`
9. `npm run build`
10. `npm run tauri:build -- --debug`

## Continuous Delivery

The scaffold includes a draft release workflow at `.github/workflows/release.yml`.

Use it after:

- app metadata is finalized
- icons are added
- signing secrets are configured for Windows and macOS
- the native build passes reliably in CI

The release workflow currently:

- triggers on `workflow_dispatch`
- can also trigger on tags matching `app-v*`
- builds artifacts per platform with `tauri-apps/tauri-action`
- creates a draft GitHub release

## Recommended next steps

- Commit a `package-lock.json` after the first successful install and switch workflows from `npm install` to `npm ci`.
- Add desktop smoke tests once the MVP connection flow is interactive.
- Add signing and notarization after the release path is stable.
