# Connections — Reset

- **Location**: [src/features/connections/ConnectionsPage.tsx](../../src/features/connections/ConnectionsPage.tsx) (builder actions)
- **Label**: "Reset"
- **Variant**: Ghost.
- **Trigger**: Always visible in the builder actions row when a device is
  selected.
- **Workflow**: Calls `handleResetDraft`, which rebuilds the draft from the
  device's saved connection (or a fresh draft if none exists), discarding
  the pending edits.
- **Disabled when**: `isSaving` is true.
- **Why it exists**: Lets the user back out of in-progress changes without
  navigating away.
