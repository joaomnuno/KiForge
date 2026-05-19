# Connections — Remove

- **Location**: [src/features/connections/ConnectionsPage.tsx](../../src/features/connections/ConnectionsPage.tsx) (builder actions)
- **Label**: "Remove"
- **Variant**: Ghost.
- **Trigger**: Shown only when the current device already has a saved
  connection (`existingConnection !== null`).
- **Workflow**: Calls `handleDeleteConnection`, which awaits
  `deleteConnectionFromCurrentProject(existingConnection.id)`. The
  connection is removed from the project document and persisted.
- **Disabled when**: `isSaving` is true.
- **Why it exists**: Lets the user retract a previously saved connection
  without going through the project list.
