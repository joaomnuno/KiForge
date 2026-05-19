# Connections — New connection

- **Location**: [src/features/connections/ConnectionsPage.tsx](../../src/features/connections/ConnectionsPage.tsx)
- **Label**: "New connection"
- **Variant**: Primary.
- **Trigger**: Header action on the "Active connections" panel.
- **Workflow**: Calls `handleNewConnection`, which selects the first project
  component that does not yet have a saved connection (falling back to the
  first component overall). Selecting it primes the planner with a fresh
  draft for that device.
- **Disabled when**: `isSaving` is true.
- **Why it exists**: Quick jump to "plan the next unplanned device" without
  scanning the navigator manually.
