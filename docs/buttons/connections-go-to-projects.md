# Connections — Go to Projects (empty state)

- **Location**: [src/features/connections/ConnectionsPage.tsx](../../src/features/connections/ConnectionsPage.tsx)
- **Label**: "Go to Projects"
- **Variant**: Primary (`<Link>`).
- **Trigger**: Shown when no project is open on `/workspace/connections`.
- **Workflow**: Navigates to `/projects`.
- **Disabled when**: Never.
- **Why it exists**: Bounces the user back to the project list before they
  try to plan connections with nothing loaded.
