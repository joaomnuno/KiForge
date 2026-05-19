# Connections — Auto-assign suggestions

- **Location**: [src/features/connections/ConnectionsPage.tsx](../../src/features/connections/ConnectionsPage.tsx)
- **Label**: "Auto-assign suggestions"
- **Variant**: Secondary.
- **Trigger**: Header action on the "Active connections" panel.
- **Workflow**: When a draft exists, calls
  `setDraft(autoAssignDraft(currentProject, draft))`. The planner fills in
  any unassigned required signals with the first viable pin candidate.
  Selections already made by the user are preserved.
- **Disabled when**: `!draft || isSaving`.
- **Why it exists**: Bootstraps a working draft without forcing the user to
  pick every pin by hand. The user can still override anything afterwards.
