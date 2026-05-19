# Projects card — Rename

- **Location**: [src/features/projects/ProjectsPage.tsx](../../src/features/projects/ProjectsPage.tsx)
- **Label**: "Rename"
- **Variant**: Ghost.
- **Trigger**: One per project card.
- **Workflow**: Opens `window.prompt("Rename project", projectName)`. If the
  user enters a non-empty value, calls `renameProject` on the store. Empty
  or cancelled prompts are no-ops.
- **Disabled when**: `isBusy` (`isSaving || isExporting`).
- **Why it exists**: Inline rename without forcing the user to open the
  project and edit it through a different form.
