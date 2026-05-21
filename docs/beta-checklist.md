# KiForge v0.1 beta ship checklist

Last reviewed: 2026-05-21.

Beta = "we can hand this to a hardware planner, they can take a project from blank to KiCad bundle on disk, the result opens in KiCad". Not "every feature done"; "the happy path is honest end-to-end + the rough edges are documented, not hidden".

## Exit criteria (from [docs/roadmap.md §Exit criteria for v0.1](roadmap.md#exit-criteria-for-v01))

- [x] Open the app, create a project from blank or from a template.
- [x] Add devices from the catalog, name them, remove them.
- [x] Plan SPI / I2C / UART connections with explicit pin assignment, including shared-bus modes.
- [x] See `Ready to Generate` status reached from real validation, not from a manual edit. (PR #30 wired stored → derived in projects list + card + shell.)
- [x] Export a starter bundle (manifest + project JSON, plus minimum-valid `.kicad_sch` + `.kicad_pro`) to disk on desktop. (PRs #23 + #24 + #28.)
- [ ] Land the changes in main with CI green across Ubuntu / macOS / Windows. _(Every PR CI is green; the matrix runs per-PR. This box flips once the beta-tag commit itself ships.)_

## Smoke flow (must pass on every desktop platform before tagging)

Run `bun run tauri:dev`. Then:

1. `/projects` → **Start a new design**.
2. Create project: name `Rocket FC Beta`, controller STM32F405RG, voltage domain 3.3V, template Blank project. Submit.
3. Land on the workspace shell. Header shows **STM32F405RG · 3.3V domain**, derived status **Draft**.
4. Progress strip shows Identity ✓, every other step still empty.
5. Components page → add W25Q128JV (Flash) and ICM-42688-P (IMU). Project inventory updates; Components step flips to ✓.
6. Connections page → New Connection for Flash → protocol SPI → controller interface SPI1 → bus mode Dedicated → Auto-assign pins → Save. Repeat for IMU on SPI2.
7. Inspector panels on the right (slot from #26 + #29) update as you pick devices.
8. Validation step ✓ (no errors, only info-level optional-signal hints from #36).
9. Overview page → derived status now **Ready to Generate**. Header **Export KiCad bundle** button enabled.
10. Click **Export KiCad bundle**. Toast: `Wrote KiCad starter bundle for "Rocket FC Beta" to <path>/projects/<id>/kicad/`.
11. On disk: `<app_data>/com.kiforge.app/projects/<id>/kicad/` contains `<id>.kicad_sch` + `<id>.kicad_pro`.
12. Open the `<id>.kicad_pro` in KiCad 7 or newer. KiCad opens it cleanly. (Empty schematic per current bundle slice — symbol placement is a post-beta enhancement.)
13. Derived status now **Generated**. Export step ✓. Re-export overwrites cleanly.
14. Overview page → **Edit identity** → change voltage domain to 5V → save. Validation step flips to ⚠ with voltage-mismatch warnings for the 3.3V-only parts (#25). Change back to 3.3V → warnings clear.
15. Delete the project from `/projects` via the styled `ConfirmDialog` (#34). Folder removed from disk.

## Pre-tag tasks (must land before the beta cut)

- [ ] Engineer Phase B PRs merged: `feat/ui-radix-dropdown` (AccountMenu), `feat/ui-radix-tooltip` (progress-strip hacky-route disclaimers + Export-button gating reason), `feat/ui-radix-tabs` (Overview steps grouped).
- [ ] Progress strip redesign per the wireframe — 5 chevron step tiles + 1 separate Export block, fit in 1180px without horizontal scroll. Drives by `getProjectProgress` step status. Hold until Tooltip lands; the strip's "Pin Mapping" and "Validation" tiles want a tooltip explaining they share routes with Connections / Overview.
- [ ] Manual smoke on Ubuntu (WSL is fine), macOS, Windows. Capture screenshots of the workspace shell + a successful export toast for the release notes.
- [ ] Tag bundle smoke: `bun run tauri:build --debug` on Linux. Verify the AppImage / .deb opens, the workspace boots, and an export still lands at `<app_data>/com.kiforge.app/projects/<id>/kicad/`.

## Acceptable beta gaps (documented, not blockers)

These are intentional shortfalls. Either user-discoverable via the validation system or already called out in [docs/roadmap.md §Where we are honest about gaps](roadmap.md#where-we-are-honest-about-gaps):

- Exported `.kicad_sch` is header-only. Symbol placement + wire generation are a post-beta slice (`feat/kicad-bundle-place-symbols`). KiCad still opens the file; users wire components themselves the first time.
- Top-toolbar search input is decorative (does not filter). Per `.claude/rules/frontend-ui.md` §8 we should label or remove pre-tag; **action item**: pick one before the cut.
- "Sign out" in account menu is a notice (no auth). Out-of-scope per roadmap. Keep as-is.
- Theme pills in Settings persist a preference but the app always renders dark. Out-of-scope per roadmap. Keep as-is.
- Boot/debug/strapping-pin warnings and controller alternate-function ambiguity validators are not yet wired — they need a controller-catalog schema bump (`reservedPins[]`, `pinRoles{}`). Tracked under `feat/catalog-controller-pin-roles`, post-beta.
- Web preview (`bun run dev` without Tauri) silently falls back to `localStorage`. Per roadmap P4 we should gate destructive workflows on desktop-only; **action item**: add a `Desktop-only` banner on web preview for export + delete pre-tag (small slice).

## Pre-tag verification command

Run from a clean checkout on each OS:

```bash
bun install
bun run ci:check         # lint + format:check + typecheck + test + build + rust:check
bun run tauri:build --debug
```

Tag the commit only after all three return clean and the smoke flow above passes.

## Tag procedure

1. `git checkout main && git pull --prune`
2. `git tag -a app-v0.1.0-beta.1 -m "KiForge v0.1.0 beta.1"`
3. `git push origin app-v0.1.0-beta.1`
4. The `release.yml` workflow on tag push runs `tauri-action` and creates a draft GitHub release with bundles per platform.
5. Manually publish the draft release with release notes referencing this checklist + the screenshots captured in pre-tag smoke.

## Post-beta queue (top of stack for the next milestone)

1. `feat/kicad-bundle-place-symbols` — controller + peripheral symbols in the exported `.kicad_sch`. Needs the KiCad `lib_id` research currently in flight.
2. `feat/catalog-controller-pin-roles` — schema bump for `reservedPins[]` + `pinRoles{}` to unlock the boot/debug + alt-fn validators.
3. `feat/progress-strip-redesign` — chevron + Export-tile layout per the wireframe (uses Tooltip from Phase B).
4. `feat/web-preview-desktop-only-banner` — roadmap P4 gating.
5. `feat/ui-radix-select` + `feat/ui-radix-toast` — finish Phase B coverage.
6. `feat/catalog-esp32-s3` + `feat/catalog-stm32g0` — roadmap P3 controller growth.
