# Projects card — Open

- **Location**: [src/features/projects/ProjectsPage.tsx](../../src/features/projects/ProjectsPage.tsx)
- **Label**: "Open"
- **Variant**: Secondary.
- **Trigger**: One per project card in the project list.
- **Workflow**: Calls `handleOpenProject(project.id)`, which awaits
  `openProject` on the workspace store. If the project becomes active, the
  page navigates to `/workspace/components`.
- **Disabled when**: `isSaving || isExporting` (the `isBusy` flag).
- **Why it exists**: Promotes the project's persisted state into the
  workspace and drops the user into the next planning step.
