# Sidebar — Navigation links

- **Location**: [src/components/layout/AppSidebar.tsx](../../src/components/layout/AppSidebar.tsx),
  driven by [src/data/navigation.ts](../../src/data/navigation.ts).
- **Labels**: Projects, Templates, Library, Settings.
- **Variant**: `nav-link` (renders as a router `<Link>`, gains
  `nav-link--active` when on the matching route).
- **Trigger**: Always visible on the sidebar (hidden under 980px wide).
- **Workflow**:
  - **Projects** → `/projects`
  - **Templates** → `/templates`
  - **Library** → `/workspace/components` (enters the project shell; redirects to `/projects` if no project is open)
  - **Settings** → `/settings`
- **Disabled when**: Never.
- **Why it exists**: Primary global navigation on the outer shell. Each link
  maps directly to one route — no duplicates and no dead ends. Once a project
  is open, the project shell replaces this sidebar with a step-driven
  progress strip.
