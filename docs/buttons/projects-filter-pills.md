# Projects — Filter pills

- **Location**: [src/features/projects/ProjectsPage.tsx](../../src/features/projects/ProjectsPage.tsx)
- **Labels**: "All Projects", "Recent", "Ready to generate"
- **Variant**: `filter-pill` (becomes `filter-pill--active` when selected).
- **Trigger**: Always visible above the project cards grid.
- **Workflow**: Clicking sets `activeFilter` in component state and the
  card grid recomputes:
  - **All Projects** — every project, in the store's natural order.
  - **Recent** — top 5 by `updatedAt` descending.
  - **Ready to generate** — only projects whose status is
    `"Ready to Generate"`.
    When the filtered list is empty (but the store has projects), an empty
    panel is shown with a "Show all projects" recovery button.
- **Disabled when**: Never.
- **Why it exists**: Lets the user slice their projects without navigating
  away. The previous implementation rendered the pills with no handler and
  a hard-coded active state — they have been wired up here.
