# New project — Create project (submit)

- **Location**: [src/features/projects/NewProjectPage.tsx](../../src/features/projects/NewProjectPage.tsx)
- **Label**: "Create project" (becomes "Creating..." while saving).
- **Variant**: Primary (`type="submit"`).
- **Trigger**: Always visible in the form actions row.
- **Workflow**: Submits the React Hook Form payload through
  `createProjectInputSchema` validation, then calls `createProject` on the
  store. When a `templateId` was passed via location state, the matching
  template's components are added via `addComponentToCurrentProject` after
  the project is created, and the user is navigated to
  `/workspace/components`.
- **Disabled when**: `isSaving` is true.
- **Why it exists**: Final commit step for project identity. Disabling
  during save prevents duplicate submissions.
