# Projects card — Delete

- **Location**: [src/features/projects/ProjectsPage.tsx](../../src/features/projects/ProjectsPage.tsx)
- **Label**: "Delete"
- **Variant**: Ghost.
- **Trigger**: One per project card.
- **Workflow**: Confirms via `window.confirm("Delete \"<name>\"?")`. On
  confirmation calls `deleteProject` on the store, which removes the
  project from the filesystem / `localStorage` and from the in-memory list.
- **Disabled when**: `isBusy` (`isSaving || isExporting`).
- **Why it exists**: Safety-checked destructive action visible right next to
  the project it affects.
