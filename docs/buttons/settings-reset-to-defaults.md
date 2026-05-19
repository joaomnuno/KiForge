# Settings — Reset to defaults

- **Location**: [src/features/settings/SettingsPage.tsx](../../src/features/settings/SettingsPage.tsx)
- **Label**: "Reset to defaults"
- **Variant**: Ghost.
- **Trigger**: Always visible at the bottom of the settings page.
- **Workflow**: Confirms via `window.confirm("Reset all preferences to defaults?")`.
  On confirmation, calls `resetSettings` on the settings store, which
  rewrites every key in `localStorage` to the built-in defaults. A toast
  confirms the reset.
- **Disabled when**: Never.
- **Why it exists**: One-click recovery from a bad preference combination
  without manually editing each field.
