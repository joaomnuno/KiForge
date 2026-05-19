# Components — Project device row inline rename

- **Location**: [src/features/components/ComponentsPage.tsx](../../src/features/components/ComponentsPage.tsx) (`ProjectComponentRow`)
- **Label**: Editable instance name (`<input className="field__control">`).
- **Variant**: Inline form control (not a button).
- **Trigger**: One per project device in the "Devices in this project — {N}" panel.
- **Workflow**: Controlled input with local state. On blur OR on Enter (which triggers blur), commits the trimmed value via `renameComponentInCurrentProject(component.id, value)`. Empty or unchanged values are silently reverted; the store no-ops on empty values too.
- **Disabled when**: `isSaving` is true.
- **Why it exists**: Lets the user disambiguate instances of the same part (e.g. two BMP388s) without leaving the page or opening a modal.
