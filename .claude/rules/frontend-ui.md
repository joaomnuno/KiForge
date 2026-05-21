---
paths:
  - "src/app/**"
  - "src/components/**"
  - "src/features/**"
  - "src/styles/**"
  - "src/**/*.ts"
  - "src/**/*.tsx"
---

# Frontend UI Quality Rule

Adapts Anthropic's "Prompting for frontend aesthetics" guidance to KiForge.
KiForge is a Tauri 2 + React 19 + Vite 6 + TypeScript + Bun **desktop engineering tool** — a project-definition workspace that planners use before opening KiCad. Treat every screen like a tool surface, not a marketing page.

This rule extends [AGENTS.md](../../AGENTS.md) §Frontend Rules and [frontend.md](frontend.md). When in conflict, AGENTS.md wins.

## 1. Avoid generic AI UI

- **No SaaS-dashboard slop.** No purple gradients, no decorative hero panels, no random "stats" cards, no oversized rounded boxes, no glassmorphism.
- **No decorative motion or icons** that do not encode product state.
- **No whole-app redesigns** unless the user explicitly asks. Match the existing design language.
- Reference: existing tokens at [src/styles/tokens.css](../../src/styles/tokens.css), layout chrome in [src/components/layout/](../../src/components/layout/), primitives in [src/components/ui/](../../src/components/ui/) (`Button`, `Panel`, `StatusBadge`). Reuse before reinventing.

## 2. Design intent

Before writing JSX:

1. Open the nearest existing screen (`src/features/<adjacent>/...Page.tsx`) and read it.
2. State in one sentence what question this screen answers (e.g. "Which devices are in this project?"). See [design-files/PLAN.md §1.2 "The core UI rule"](../../design-files/PLAN.md).
3. Identify the **primary action**, **secondary actions**, and read-only structure.
4. Pick the visual hierarchy: one dominant region, supporting regions, peripherals. Don't make everything compete.

If the screen has no clear primary action, the design is wrong — fix the design before shipping JSX.

## 3. Typography

- Use the three token families: `--font-body` (Inter) for prose, `--font-display` (Space Grotesk) for headings, `--font-mono` (JetBrains Mono) for technical values (part numbers, pins, voltages).
- One H1 per page. Subsections use H2/H3 sparingly.
- Use `--text` for body, `--text-muted` for secondary, `--text-subtle` for tertiary/labels. Don't reach for `font-weight: 700` everywhere — bold is for the one thing you want the eye to land on.
- Eyebrow labels are uppercase, letterspaced, `--font-mono`, `--text-subtle` (existing `.eyebrow` / `.panel__eyebrow` class).

## 4. Layout and spacing

- Constrain content widths on text-heavy pages (existing `.page-stack--narrow` caps at 860px).
- Prefer CSS grid (`.cards-grid`, `.connection-grid`, `.stats-grid`) for tabular data; flex for inline groups.
- Spacing scale: 6 / 10 / 12 / 14 / 18 / 22 / 28 px — match neighboring code, don't introduce arbitrary new values.
- Always design **empty**, **loading**, **error**, and **dense** states. An empty inventory list is not the same as a hidden inventory list. Use [design-files/PLAN.md §2.4 "Empty state"](../../design-files/PLAN.md) as the model.
- Don't span full viewport width for forms or single-column reading — the existing project shell is a constrained workspace, not a landing page.

## 5. Components

- Search [src/components/ui/](../../src/components/ui/) and [src/components/layout/](../../src/components/layout/) before creating a new component. `Panel`, `Button`, `StatusBadge`, `AppScaffold`, `AccountMenu`, `ProjectStrip`, `TopToolbar`, `AppSidebar` already exist.
- Feature-scoped components live in `src/features/<feature>/`. Promote to `src/components/` only when used by two or more features.
- Keep components **focused**: rendering + small derived UI only. Business logic and validation belong in `src/features/<feature>/*.ts` (e.g. `planner.ts`, `voltage-validation.ts`, `project-progress.ts`).
- Typed props (no `any`), named exports, kebab-case file names for `.ts`, PascalCase for components.

## 6. Interaction quality

- Use real `<button>`, `<a>` (via `react-router-dom` `<Link>`), `<form>`, `<label>`, `<select>`, `<textarea>`. No clickable `<div>`s.
- Forms have visible labels, native `required`, and a clear submit + cancel pair. Disable the submit button while saving and show "Saving..." text — match the existing pattern in [ProjectOverviewPage](../../src/features/workspace/ProjectOverviewPage.tsx).
- Keyboard: focus order matches reading order; visible focus rings (don't strip the browser default unless replacing it with something at least as visible).
- Hover / focus / disabled / active states for every interactive element. The dark theme means low-contrast hover states must use lightness change OR an outline, not just a faint tint.
- `aria-label` on icon-only buttons and on any aside without a heading (existing `.project-shell__inspector` uses this pattern).

## 7. Visual polish

- Reach for **contrast + spacing + alignment** before reaching for shadows or borders.
- The design uses subtle depth: `--shadow-soft` on cards is the only blessed shadow. Skip stacked shadows and large blurs.
- Borders use `--outline` / `--outline-ghost`. Don't introduce new border colors.
- Status conveyed via color must also be conveyed via text or icon shape — color-blind users + the catalog UI are color-dense already.
- **No animation libraries.** If a transition adds clarity (200ms color change on hover, fade-in for an inserted row), use CSS `transition`. Anything bigger needs approval.
- Emoji icons are forbidden in UI strings unless the user explicitly asks. SVG icons are fine when they encode state.

## 8. Desktop tool considerations

- Density matters: a planner is a tool, not a landing page. Compact rows, tight grids, multi-column layouts are correct here.
- Top toolbar + left sidebar + main work area + right inspector slot is the established frame (see [design-files/PLAN.md §1.1](../../design-files/PLAN.md) and `ProjectShell`'s inspector slot from PR #26). Don't fight it.
- Search inputs in the top toolbar do not currently filter — don't ship UI that promises behavior the back end can't deliver yet. If a control is decorative pending wiring, label it as such or omit it.
- The window is resizable down to 1180×760. Test layouts at that size, not 1920×1080.

## 9. Implementation workflow

For any meaningful UI change:

1. **Inspect** the nearest existing component(s) and the corresponding [design-files/](../../design-files/) subdirectory.
2. **Describe** in one or two sentences: what region you're touching, what primary action lives there, what the change accomplishes.
3. **Implement the smallest useful change.** Don't refactor neighbors.
4. **Validate**: `bun run typecheck && bun run lint && bun run format:check && bun run test`.
5. **State explicitly what was not validated.** Headless tests cover behavior, not aesthetics — if you didn't run `bun run dev` and look at it, say so.

## Bad vs Good

**Bad**

> "Create a modern dashboard with cards, stats tiles, and a gradient hero. Add a sparkline."

Produces: 3 large rounded cards with fake numbers, purple→teal gradient hero, decorative chart with no data behind it, inconsistent paddings, mobile-first hamburger that breaks the desktop frame.

**Good**

> "Add a catalog browser layout with a left categories panel (`Communications / Sensors / Memories / Debug`), a center searchable result list reusing `Panel`, an inline filter row, and a typed empty state when filters match zero parts. Each card is keyboard-focusable, has an `Add` button, and exposes voltage + package via the existing eyebrow/value pattern."

Produces: a screen consistent with the existing components page, no novel primitives, a real empty state, keyboard nav, no decorative chrome.
