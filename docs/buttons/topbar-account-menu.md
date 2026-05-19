# Top toolbar — Account menu

- **Location**: [src/components/layout/AccountMenu.tsx](../../src/components/layout/AccountMenu.tsx)
- **Label**: User initials (derived from `displayName` in settings store).
- **Variant**: Circular avatar button (`avatar avatar--button`) that opens a
  dropdown panel.
- **Trigger**: Always visible on the top toolbar.
- **Workflow**: Toggles a menu containing:
  - **Preferences** → navigates to `/settings`
  - **Browse templates** → navigates to `/templates`
  - **New project** → navigates to `/projects/new`
  - **Sign out** → shows an info dialog explaining the app runs locally and
    closes the menu.
  The menu closes on outside click and on `Escape`.
- **Disabled when**: Never.
- **Why it exists**: Surfaces identity and quick navigation without taking
  toolbar space for many separate buttons.
