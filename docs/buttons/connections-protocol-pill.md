# Connections — Protocol pill

- **Location**: [src/features/connections/ConnectionsPage.tsx](../../src/features/connections/ConnectionsPage.tsx) (builder section)
- **Label**: The protocol name (SPI, I2C, UART, USB, SWD).
- **Variant**: `filter-pill` (becomes `filter-pill--active` for the selected
  protocol).
- **Trigger**: One per protocol returned by `getCompatibleProtocolOptions`
  for the current device.
- **Workflow**: Sets the draft's `protocol`. The planner re-normalizes the
  draft, recalculating interface options, allowed bus modes, signal rows,
  and optional signals.
- **Disabled when**: Never (only compatible protocols are rendered).
- **Why it exists**: Lets the user choose how a device should be connected
  before committing to a controller interface.
