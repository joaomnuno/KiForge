# Connections — Save (Save connection / Save changes)

- **Location**: [src/features/connections/ConnectionsPage.tsx](../../src/features/connections/ConnectionsPage.tsx) (builder actions)
- **Label**: "Save connection" when no record exists yet, "Save changes"
  when editing an existing one.
- **Variant**: Primary.
- **Trigger**: Always visible in the builder actions row when a device is
  selected.
- **Workflow**: Calls `handleSaveConnection`, which builds a
  `ConnectionRecord` via `buildConnectionRecordFromDraft` and awaits
  `saveConnectionToCurrentProject`. The new or updated record is persisted
  and reflected in the active-connections panel.
- **Disabled when**: `isSaving || !draft.protocol || !draft.controllerInterface`.
- **Why it exists**: Final commit step for a planned connection. Disabling
  on incomplete drafts prevents persisting invalid records.
