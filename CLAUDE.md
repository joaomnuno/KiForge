# Claude Code Instructions

@AGENTS.md

## Claude-specific notes

Use [AGENTS.md](AGENTS.md) as the source of truth for stack, layout, commands, conventions, and rules. Do not duplicate that content here.

Path-scoped guidance lives in `.claude/rules/` and is loaded automatically when you touch matching files:

- `.claude/rules/frontend.md` — `src/**/*.{ts,tsx,css}` and feature/component organization.
- `.claude/rules/tauri-rust.md` — `src-tauri/**` and the IPC boundary.
- `.claude/rules/catalog.md` — `catalog/**`, `src/types/**`, and the catalog schema.

Shared, non-secret Claude settings live in `.claude/settings.json`. Personal overrides go in `.claude/settings.local.json` (gitignored).
