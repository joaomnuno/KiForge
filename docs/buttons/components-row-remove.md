# Components — Project device row "Remove"

- **Location**: [src/features/components/ComponentsPage.tsx](../../src/features/components/ComponentsPage.tsx) (`ProjectComponentRow`)
- **Label**: "Remove"
- **Variant**: Ghost.
- **Trigger**: One per project device in the "Devices in this project — {N}" panel.
- **Workflow**: `window.confirm("Remove {instanceName} from this project?")` then calls `removeComponentFromCurrentProject(component.id)` on the workspace store. The store strips the component from the project document AND drops any saved connection whose `componentId` matches, then persists.
- **Disabled when**: `isSaving` is true.
- **Why it exists**: Lets the user retract a device they added from the catalog without leaving the page. Also automatically cleans up dependent connections so the project state stays consistent.
