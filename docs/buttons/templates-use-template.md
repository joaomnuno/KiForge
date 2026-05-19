# Templates — Use template

- **Location**: [src/features/templates/TemplatesPage.tsx](../../src/features/templates/TemplatesPage.tsx)
- **Label**: "Use template"
- **Variant**: Primary.
- **Trigger**: One per template card on `/templates`.
- **Workflow**: Calls `navigate("/projects/new", { state: { templateId } })`.
  `NewProjectPage` reads `location.state.templateId`, looks the template up
  in [templates-catalog.ts](../../src/features/templates/templates-catalog.ts),
  and uses its `defaultProjectName`, `defaultDescription`, `controllerId`,
  `voltageDomain`, and `outputTarget` as the form defaults. Suggested
  components are added after the project is created.
- **Disabled when**: Never.
- **Why it exists**: Skips the blank slate by preselecting a controller,
  voltage domain, and curated device list.
