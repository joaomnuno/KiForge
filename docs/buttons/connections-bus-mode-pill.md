# Connections — Bus mode pill

- **Location**: [src/features/connections/ConnectionsPage.tsx](../../src/features/connections/ConnectionsPage.tsx)
- **Label**: "Dedicated" or "Shared".
- **Variant**: `filter-pill` (active state on the selected mode).
- **Trigger**: Rendered for each bus mode allowed by the chosen interface
  (`getAllowedBusModes`).
- **Workflow**: Sets the draft's `busMode`. Some interfaces only allow one
  mode, in which case a single pill is shown for clarity.
- **Disabled when**: Never (only allowed modes are rendered).
- **Why it exists**: Forces an explicit choice between dedicating a bus to
  this device or marking it as shared, which downstream validation relies
  on.
