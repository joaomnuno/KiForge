# New project — Cancel

- **Location**: [src/features/projects/NewProjectPage.tsx](../../src/features/projects/NewProjectPage.tsx)
- **Label**: "Cancel"
- **Variant**: Ghost (`type="button"` so it does not submit the form).
- **Trigger**: Always visible in the form actions row.
- **Workflow**: Navigates back to `/projects`. Form state is discarded.
- **Disabled when**: Never.
- **Why it exists**: Gives the user an unambiguous abort path that doesn't
  rely on browser back navigation.
