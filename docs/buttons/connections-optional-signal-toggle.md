# Connections — Optional signal toggle

- **Location**: [src/features/connections/ConnectionsPage.tsx](../../src/features/connections/ConnectionsPage.tsx)
- **Label**: "Add &lt;signal name&gt;" or "Remove &lt;signal name&gt;".
- **Variant**: `filter-pill` (active when the signal is enabled).
- **Trigger**: One per optional signal returned by
  `getAvailableOptionalSignals` for the current device + protocol.
- **Workflow**: Toggles the signal name in
  `draft.enabledOptionalSignals`. When enabled, the signal also appears as
  a new row in the assignment table; when removed, its previous selection
  is dropped.
- **Disabled when**: Never.
- **Why it exists**: Optional signals (chip-select, reset, interrupt, etc.)
  vary per device; the toggle keeps them opt-in instead of forcing the user
  to assign pins they don't need.
