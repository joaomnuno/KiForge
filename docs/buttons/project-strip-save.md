# Project strip — Save Project

- **Location**: [src/components/layout/ProjectStrip.tsx](../../src/components/layout/ProjectStrip.tsx)
- **Label**: "Save Project" (becomes "Saving..." while a save is in flight).
- **Variant**: Secondary.
- **Trigger**: Shown only when a workspace page renders the project strip
  (Components and Connections screens, when a project is open).
- **Workflow**: Calls `saveCurrentProject` on the workspace store, which
  serializes the current project document and writes it to the active
  storage backend (Tauri filesystem on desktop, `localStorage` on web).
- **Disabled when**: Not strictly disabled, but the label flips to
  "Saving..." while `isSaving` is true.
- **Why it exists**: Lets the user commit ad-hoc edits to disk on demand
  even when auto-save is off in Settings.
