# Components — Add

- **Location**: [src/features/components/ComponentsPage.tsx](../../src/features/components/ComponentsPage.tsx)
- **Label**: "Add"
- **Variant**: Secondary.
- **Trigger**: One per library card in the components grid.
- **Workflow**: Calls `addComponentToCurrentProject(entry.id)` on the
  workspace store, which appends the catalog component to the current
  project (with a generated instance name) and persists the change.
- **Disabled when**: `isSaving` is true.
- **Why it exists**: Direct, low-ceremony way to extend the project's
  device inventory while browsing.
