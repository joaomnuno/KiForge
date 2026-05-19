# Components — Category pill

- **Location**: [src/features/components/ComponentsPage.tsx](../../src/features/components/ComponentsPage.tsx)
- **Label**: Category label (driven by `catalog.categories`).
- **Variant**: `category-item` (becomes `category-item--active` when
  selected).
- **Trigger**: One per category in the catalog, rendered in the left
  navigator panel.
- **Workflow**: Calls `setActiveCategoryId(category.id)`. The library grid
  filters down to entries whose `categoryId` matches.
- **Disabled when**: Never.
- **Why it exists**: Lets the user focus the catalog on a specific device
  role (controllers, sensors, storage, etc.) instead of scrolling through
  everything.
