# Settings — Theme pill

- **Location**: [src/features/settings/SettingsPage.tsx](../../src/features/settings/SettingsPage.tsx)
- **Labels**: "Dark", "System", "Light"
- **Variant**: `filter-pill` (active for the currently selected theme).
- **Trigger**: Always visible in the Appearance panel.
- **Workflow**: Calls `updateSetting("theme", choice)` on the settings
  store (persisted via `zustand/middleware/persist` to `localStorage`).
  A short toast confirms the change.
- **Disabled when**: Never.
- **Why it exists**: Stores the user's theme preference so other surfaces
  (eventually colour tokens, charts, etc.) can read it. The current build
  always renders dark; the choice is persisted for when light/system land.
