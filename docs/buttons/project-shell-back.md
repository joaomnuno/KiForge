# Project shell — Back to Projects

- **Location**: [src/features/workspace/ProjectShell.tsx](../../src/features/workspace/ProjectShell.tsx)
- **Label**: "← Projects"
- **Variant**: Subtle pill link (`project-shell__back`).
- **Trigger**: Always visible in the project shell header (top-left).
- **Workflow**: Navigates back to `/projects`. Exits the focused project shell back to the outer list.
- **Disabled when**: Never.
- **Why it exists**: Single, predictable escape hatch from the focused workflow back to the list.
