# Connections — Go to Components (empty state)

- **Location**: [src/features/connections/ConnectionsPage.tsx](../../src/features/connections/ConnectionsPage.tsx)
- **Label**: "Go to Components"
- **Variant**: Primary (`<Link>`).
- **Trigger**: Shown when a project is open but has no devices added yet.
- **Workflow**: Navigates to `/workspace/components`.
- **Disabled when**: Never.
- **Why it exists**: There is nothing to wire up if the inventory is empty —
  this redirects the user to the prerequisite step.
