# Projects — Show all projects (recovery)

- **Location**: [src/features/projects/ProjectsPage.tsx](../../src/features/projects/ProjectsPage.tsx)
- **Label**: "Show all projects"
- **Variant**: Secondary.
- **Trigger**: Shown only when a filter pill yields an empty result set
  (projects exist but none match the active filter).
- **Workflow**: Calls `setActiveFilter("All Projects")`.
- **Disabled when**: Never (the recovery panel is hidden when not needed).
- **Why it exists**: Recovers from an empty filter without forcing the user
  to find the "All Projects" pill themselves.
