# Templates — Start blank (inspector)

- **Location**: [src/features/templates/TemplatesPage.tsx](../../src/features/templates/TemplatesPage.tsx) (inspector panel)
- **Label**: "Start blank"
- **Variant**: Secondary.
- **Trigger**: Always visible in the templates page inspector.
- **Workflow**: Equivalent to clicking "Use template" on the "Blank project"
  card — navigates to `/projects/new` with `templateId: "blank-project"`.
- **Disabled when**: Never.
- **Why it exists**: Quick escape hatch when the user opens templates but
  decides to start without preselected devices.
