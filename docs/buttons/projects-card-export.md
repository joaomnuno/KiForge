# Projects card — Export

- **Location**: [src/features/projects/ProjectsPage.tsx](../../src/features/projects/ProjectsPage.tsx)
- **Label**: "Export"
- **Variant**: Ghost.
- **Trigger**: One per project card.
- **Workflow**: Calls `handleExportProject(project.id)`, which awaits the
  store's `exportProject`. On success the page renders the export-result
  panel (with the "Download JSON" anchor in web mode, or a path message on
  desktop).
- **Disabled when**: `isBusy` (`isSaving || isExporting`).
- **Why it exists**: Produces a portable JSON snapshot of the project's
  state without leaving the project list.
