# Connections — Device navigator item

- **Location**: [src/features/connections/ConnectionsPage.tsx](../../src/features/connections/ConnectionsPage.tsx)
- **Label**: Device instance name + part name + status badge.
- **Variant**: `device-list__item` (gains `category-item--active` for the
  selected device).
- **Trigger**: One per device on the project, rendered in the left
  navigator panel.
- **Workflow**: Calls `selectComponent(component.id)`. The planner rebuilds
  a draft scoped to the selected device.
- **Disabled when**: Never.
- **Why it exists**: Primary way to switch which device you're planning
  signals for.
