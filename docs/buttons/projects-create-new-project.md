# Projects — Create New Project (empty state)

- **Location**: [src/features/projects/ProjectsPage.tsx](../../src/features/projects/ProjectsPage.tsx)
- **Label**: "Create New Project"
- **Variant**: Primary (`<Link>`).
- **Trigger**: Shown only inside the "No projects yet" panel — i.e. when
  the local project store has loaded and is empty.
- **Workflow**: Navigates to `/projects/new`.
- **Disabled when**: Never (the entire panel is hidden when projects exist).
- **Why it exists**: Guides first-run users to the project-creation flow
  without making them hunt for the toolbar button.
