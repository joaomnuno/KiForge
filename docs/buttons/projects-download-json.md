# Projects — Download JSON

- **Location**: [src/features/projects/ProjectsPage.tsx](../../src/features/projects/ProjectsPage.tsx)
- **Label**: "Download JSON"
- **Variant**: Secondary (rendered as `<a download>` styled as a button).
- **Trigger**: Shown only after a project export succeeds in web preview
  mode, when the store's `exportResult.kind === "download-url"`.
- **Workflow**: The anchor's `href` is a blob URL produced by the export
  service and the `download` attribute carries the suggested file name.
  Clicking triggers a native browser download — no JavaScript handler.
- **Disabled when**: Never (the surrounding panel is only mounted when an
  exportable result exists).
- **Why it exists**: Lets the user pick up the exported project JSON in the
  browser build, where there's no Tauri filesystem to write to directly.
