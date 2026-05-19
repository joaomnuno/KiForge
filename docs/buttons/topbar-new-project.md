# Top toolbar — New Project

- **Location**: [src/components/layout/TopToolbar.tsx](../../src/components/layout/TopToolbar.tsx)
- **Label**: "New Project"
- **Variant**: Primary (rendered as `<Link>` styled with `button button--primary`)
- **Trigger**: Always visible on the top toolbar across every route.
- **Workflow**: Navigates to `/projects/new` with no location state, so the
  form falls back to the standard defaults instead of a template.
- **Disabled when**: Never.
- **Why it exists**: A global escape hatch to start a new project from
  anywhere in the app, without going back to `/projects`.
