# Components — Go to Projects (empty state)

- **Location**: [src/features/components/ComponentsPage.tsx](../../src/features/components/ComponentsPage.tsx)
- **Label**: "Go to Projects"
- **Variant**: Primary (`<Link>`).
- **Trigger**: Shown only when there is no active project (e.g. the user
  hit `/workspace/components` without opening a project first).
- **Workflow**: Navigates to `/projects`.
- **Disabled when**: Never (the panel is only rendered when no project is
  loaded).
- **Why it exists**: Sends the user back to the project list to pick or
  create one before continuing.
