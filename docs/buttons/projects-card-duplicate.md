# Projects card — Duplicate

- **Location**: [src/features/projects/ProjectsPage.tsx](../../src/features/projects/ProjectsPage.tsx)
- **Label**: "Duplicate"
- **Variant**: Ghost.
- **Trigger**: One per project card.
- **Workflow**: Opens a `window.prompt` pre-filled with
  `"<name> Copy"`. If the user confirms (with or without editing the name),
  calls `duplicateProject` on the store. If the user dismisses the prompt
  the operation is skipped.
- **Disabled when**: `isBusy` (`isSaving || isExporting`).
- **Why it exists**: Lets the user fork an existing project as the starting
  point for a variant without re-entering controller and device choices.
