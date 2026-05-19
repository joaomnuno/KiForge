---
paths:
  - "src-tauri/**"
---

# Tauri / Rust Rule

Follow [AGENTS.md](../../AGENTS.md) §Tauri / Rust Rules and §Security Rules. Highlights:

- Commands in `src-tauri/src/commands/`, registered in `src-tauri/src/lib.rs`. Validation + IO in `src-tauri/src/domain/`. Keep command handlers thin.
- All project IDs go through the hardened validator in `src-tauri/src/domain/project.rs` (rejects path traversal, control chars, unsafe characters). Reuse; do not bypass.
- Filesystem writes are atomic (temp-file + rename). Mirror the existing project writer.
- Do not weaken `src-tauri/capabilities/default.json` permissions. Do not add `fs:allow-*` patterns for user-controlled paths without explicit approval.
- Do not change `src-tauri/tauri.conf.json` `security.csp` casually. Replacing `csp: null` with a desktop-appropriate CSP is a roadmap P0 item that needs deliberate review.
- Treat all input crossing the IPC boundary as untrusted. Validate on the Rust side.
- Keep types serde-friendly. Any Rust enum exposed to the frontend must have a mirror in `src/types/domain.ts`.
- Rust edition 2021, `rust-version = "1.77"`. Run `bun run rust:fmt && bun run rust:clippy && bun run rust:test` (or `bun run rust:check`) after Rust changes.
- Do not run `tauri build` casually — slow, needs OS prerequisites. Run only when explicitly requested or when changing Tauri bundle/security config.
