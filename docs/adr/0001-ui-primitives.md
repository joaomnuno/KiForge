# ADR 0001 — UI primitives: Radix UI + existing tokens

- **Status**: Accepted
- **Date**: 2026-05-21
- **Decision drivers**: KiForge is a Tauri 2 + React 19 + Vite + Bun **desktop engineering tool** (project-definition workspace before KiCad). Existing CSS-token design system in `src/styles/tokens.css`. AGENTS.md §Frontend Rules forbids introducing a UI framework or styling system without explicit approval; this ADR records that approval.

## Decision

Adopt **Radix UI Primitives** as the headless behavior + accessibility layer. Keep `src/styles/tokens.css` and the existing CSS as the single design source. Build thin styled wrappers in `src/components/ui/` per primitive, adopted **incrementally** (one primitive per PR, one consumer migration per PR), not a big-bang rewrite.

When and only when a need appears that Radix does not cover:

- **`@tanstack/react-table`** — headless table primitives if the catalog browser outgrows the current list view.
- **`cmdk`** — command palette (Ctrl/⌘+K) if/when we want one.
- **`sonner`** — toast/notification system if the current ad-hoc toast becomes load-bearing.

Each of those is a separate later ADR, not part of this decision.

## Alternatives considered

| Library | Why not |
|---|---|
| **React Aria Components** (Adobe) | Best a11y baseline in the industry; lost to Radix on smaller mental model + lighter component-by-component install. Strong runner-up — revisit if Radix coverage gaps appear. |
| **Mantine v8** | Batteries-included (Table, Tree, Calendar, Combobox), React 19 supported, CSS-vars themable. Lost on opinionated default style — we would spend the migration cost overriding its look to keep KiForge's engineering-tool aesthetic. Reconsider if we hit a Radix coverage wall and need 3+ heavy data components at once. |
| **shadcn/ui** | Source-copied components on top of Radix + Tailwind. Lost because adopting Tailwind is itself a repo-wide migration with its own cost, and we already have a working tokens-based CSS system. Could revisit only as part of a separate "adopt Tailwind" decision. |
| **Chakra UI v3** | Web-app aesthetic, large bundle, heavier default opinion than Mantine. Wrong vibe for a desktop tool. |
| **MUI v6** | Material aesthetic — wrong for an engineering tool. Heavy bundle. Hard to brand away from. |
| **Ant Design v5** | Enterprise/dense feel is closer to fit, but global override pattern, very high design lock-in, China-locale defaults that need extra work. |
| **Fluent UI v9** (Microsoft) | OK density but heavy and Microsoft-y. Hard to escape the look. |
| **Base UI** (MUI team) | Sibling-in-spirit to Radix but smaller primitive coverage and earlier maturity. |
| **Tremor / Catalyst / Geist / Tailwind UI** | Dashboard or marketing focus. Not desktop tool. |

## Why Radix wins for KiForge

1. **Headless** preserves `src/styles/tokens.css` as the single source of design truth. Aligns with `.claude/rules/frontend-ui.md` ("contrast + spacing + alignment before reaching for shadows" — Radix gives behavior, we keep the look).
2. **Per-primitive install** (`@radix-ui/react-dialog`, `@radix-ui/react-dropdown-menu`, etc.). Vite tree-shakes. Bundle impact ~5–15 KB gzip per primitive, only pay for what we use.
3. **Accessibility we will not hand-roll correctly**: focus traps in Dialog, roving tabindex in Tabs/Menu, type-ahead in Select, popover collision detection, ESC/click-outside, ARIA roles. Hand-rolled these are bug factories.
4. **React 19 supported.** Used in production by Linear, Vercel, the entire shadcn ecosystem.
5. **MIT licensed.** No postinstall scripts, no native binaries — clean against AGENTS.md security rules.
6. **Composable** — `<Dialog.Root>` / `<Dialog.Trigger>` / `<Dialog.Portal>` / `<Dialog.Content>` etc. We wrap each primitive once in `src/components/ui/` and the rest of the app consumes our wrapper, not Radix directly. This isolates the dependency at one layer — swapping Radix for React Aria later, if we ever need to, is a wrapper rewrite, not an app-wide refactor.

## What changes in the codebase

- `package.json` grows by one or two `@radix-ui/react-*` entries per primitive adopted. No global runtime, no provider tree change.
- `src/components/ui/` gains one styled wrapper per primitive (`Dialog.tsx`, `Dropdown.tsx`, `Tooltip.tsx`, etc.).
- `src/styles/index.css` gains scoped classes (e.g. `.dialog__overlay`, `.dialog__content`) — no new CSS-in-JS library, no Tailwind, no theme provider.
- `.claude/rules/frontend-ui.md` gets a follow-up amendment noting: "for dialogs, dropdowns, tooltips, tabs, selects, menus, popovers — use the `src/components/ui/` wrapper. Don't import `@radix-ui/*` directly outside `src/components/ui/`."
- AGENTS.md §Frontend Rules: the existing "no new UI framework without approval" line stays — Radix is the **one** approved exception; future additions still need a fresh ADR.

## What does NOT change

- Routing (`react-router-dom` v6).
- State (Zustand).
- Forms (React Hook Form + Zod).
- Styling system (CSS custom properties + plain CSS).
- Tauri backend or capabilities.
- The frontend-ui rule (only an addendum noting Radix is the chosen primitive source).

## Adoption plan

**Phase A — install + Dialog (1 PR)**
- `bun add @radix-ui/react-dialog`.
- Build `src/components/ui/Dialog.tsx` wrapper.
- Replace the `window.confirm("Delete \"<name>\"?")` in `ProjectsPage` with a styled confirmation Dialog.
- Validate `bun run typecheck && bun run lint && bun run format:check && bun run test && bun run build`.

**Phase B — expand primitive set (parallel engineer PRs, 1 primitive per PR)**

| # | Primitive | Wrapper | First consumer |
|---|---|---|---|
| 1 | Dropdown menu | `src/components/ui/DropdownMenu.tsx` | Replace `AccountMenu` |
| 2 | Tooltip | `src/components/ui/Tooltip.tsx` | Inline help on Edit identity form fields + status pins on connections page |
| 3 | Tabs | `src/components/ui/Tabs.tsx` | Workspace step nav, alongside the chevron progress strip (not replacing it yet) |
| 4 | Select | `src/components/ui/Select.tsx` | Controller picker in Edit identity + New Project form |
| 5 | Toast / Notification (deferred) | TBD | Replace ad-hoc export toast |

Each Phase B PR is small, has one new wrapper, one consumer swap, one set of tests. No PR cross-touches another primitive.

**Phase C — non-Radix primitives (case-by-case, separate ADRs each)**
- `@tanstack/react-table` when catalog grows beyond the current list of 5.
- `cmdk` when we want a command palette.
- `sonner` when we want real toast infrastructure.

## Consequences

**Positive**

- Accessibility baseline that survives developer churn.
- Bundle stays small (per-primitive install + tree-shake).
- Design ownership remains in `tokens.css`; no library upgrade can change the look without us reviewing the CSS.
- Engineer parallelism: each primitive is a focused PR, no merge conflicts between them.

**Negative**

- New external dependency surface to track (Radix releases, peer-dep updates).
- Wrapper layer is one extra abstraction. Mitigated by keeping wrappers thin (the wrapper is "compose Radix parts + apply our class names" — no business logic).
- We will not get a ready-made Table, Tree, Calendar, or Combobox from Radix. When those needs land, separate ADR per dep (see Phase C).

## References

- `.claude/rules/frontend-ui.md` (frontend aesthetics rule, PR #32)
- `src/styles/tokens.css` (design tokens — the look these primitives must wear)
- `src/components/ui/` (existing `Button`, `Panel`, `StatusBadge` — the same wrapper layer Radix wrappers will live in)
- [design-files/PLAN.md](../../design-files/PLAN.md) (product UI definition this decision serves)
