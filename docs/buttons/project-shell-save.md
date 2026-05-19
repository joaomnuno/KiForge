# Project shell — Save Project

- **Location**: [src/features/workspace/ProjectShell.tsx](../../src/features/workspace/ProjectShell.tsx)
- **Label**: "Save Project" (becomes "Saving..." while `isSaving` is true).
- **Variant**: Secondary.
- **Trigger**: Always visible in the project shell header (top-right).
- **Workflow**: Calls `saveCurrentProject` on the workspace store. Persists the current project document to the active storage backend (Tauri filesystem or `localStorage`).
- **Disabled when**: Not strictly disabled, but the label flips to "Saving..." while the save is in flight.
- **Why it exists**: Replaces the old `ProjectStrip` save button. Always reachable from any workspace step.
