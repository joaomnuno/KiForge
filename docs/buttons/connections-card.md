# Connections — Connection card

- **Location**: [src/features/connections/ConnectionsPage.tsx](../../src/features/connections/ConnectionsPage.tsx)
- **Label**: Connection name, peer part, protocol/interface/bus chips, and
  the saved pin list.
- **Variant**: `connection-card` (gains `connection-card--active` when the
  card's component is the active one).
- **Trigger**: One per saved connection on the project.
- **Workflow**: Calls `selectComponent(connection.componentId)`. The planner
  rebuilds a draft from that connection, which the user can edit and save.
- **Disabled when**: Never.
- **Why it exists**: Lets the user reopen any past connection plan to edit
  or inspect it without leaving the page.
