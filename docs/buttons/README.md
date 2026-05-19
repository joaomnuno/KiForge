# Button catalog

Every interactive button surface in KiForge is documented here, one Markdown
file per button. Use this folder as the single reference when adding or
auditing UI affordances.

Each file describes:

- **Location** — the file and component that renders the button.
- **Label** — the visible text or icon.
- **Variant** — primary / secondary / ghost / pill / icon / link styled as a
  button.
- **Trigger** — the user gesture or context that surfaces it.
- **Workflow** — what happens when the user clicks it.
- **Disabled state** — when the button is greyed out.
- **Why it exists** — the user goal it serves.

## Component reference

- [button-variants.md](./button-variants.md) — the three `<Button>` variants
  rendered by [src/components/ui/Button.tsx](../../src/components/ui/Button.tsx).

## Layout chrome

- [topbar-new-project.md](./topbar-new-project.md)
- [topbar-account-menu.md](./topbar-account-menu.md)
- [project-strip-save.md](./project-strip-save.md)
- [sidebar-nav-link.md](./sidebar-nav-link.md)

## Projects screen (`/projects`)

- [projects-start-new-design.md](./projects-start-new-design.md)
- [projects-create-new-project.md](./projects-create-new-project.md)
- [projects-filter-pills.md](./projects-filter-pills.md)
- [projects-show-all-projects.md](./projects-show-all-projects.md)
- [projects-download-json.md](./projects-download-json.md)
- [projects-card-open.md](./projects-card-open.md)
- [projects-card-duplicate.md](./projects-card-duplicate.md)
- [projects-card-export.md](./projects-card-export.md)
- [projects-card-rename.md](./projects-card-rename.md)
- [projects-card-delete.md](./projects-card-delete.md)

## New project screen (`/projects/new`)

- [new-project-cancel.md](./new-project-cancel.md)
- [new-project-submit.md](./new-project-submit.md)

## Templates screen (`/templates`)

- [templates-use-template.md](./templates-use-template.md)
- [templates-start-blank.md](./templates-start-blank.md)

## Components screen (`/workspace/components`)

- [components-go-to-projects.md](./components-go-to-projects.md)
- [components-category-pill.md](./components-category-pill.md)
- [components-add.md](./components-add.md)
- [components-continue-to-connections.md](./components-continue-to-connections.md)

## Connections screen (`/workspace/connections`)

- [connections-go-to-projects.md](./connections-go-to-projects.md)
- [connections-go-to-components.md](./connections-go-to-components.md)
- [connections-auto-assign.md](./connections-auto-assign.md)
- [connections-new-connection.md](./connections-new-connection.md)
- [connections-device-navigator.md](./connections-device-navigator.md)
- [connections-card.md](./connections-card.md)
- [connections-protocol-pill.md](./connections-protocol-pill.md)
- [connections-bus-mode-pill.md](./connections-bus-mode-pill.md)
- [connections-optional-signal-toggle.md](./connections-optional-signal-toggle.md)
- [connections-reset.md](./connections-reset.md)
- [connections-remove.md](./connections-remove.md)
- [connections-save.md](./connections-save.md)

## Settings screen (`/settings`)

- [settings-theme-pill.md](./settings-theme-pill.md)
- [settings-reset-to-defaults.md](./settings-reset-to-defaults.md)
