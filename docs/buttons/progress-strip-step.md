# Project shell — Progress strip step

- **Location**: [src/features/workspace/ProjectProgressStrip.tsx](../../src/features/workspace/ProjectProgressStrip.tsx)
- **Labels**: One per step from `getProjectProgress` — Identity, Components, Connections, Pin mapping, Validation, Export.
- **Variant**: `progress-strip__link` (NavLink). Gains `progress-strip__link--active` when on the matching route. Each step's `<li>` also carries `progress-strip__step--{status}` — `complete` (cyan dot), `attention` (amber), `empty` (gray), `blocked` (red).
- **Trigger**: Always visible inside the project shell, below the header. Sticky on scroll.
- **Workflow**: Clicking navigates to the step's `href`. The strip de-duplicates steps that share an href (e.g. pin-mapping and connections both point to `/workspace/connections`).
- **Disabled when**: Never (all steps are clickable, even empty ones, so the user can preview where they need to go).
- **Why it exists**: Always-visible status + navigation. Replaces the outer sidebar inside the project shell.
