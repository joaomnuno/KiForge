# Project overview — Step card "Open"

- **Location**: [src/features/workspace/ProjectOverviewPage.tsx](../../src/features/workspace/ProjectOverviewPage.tsx)
- **Label**: "Open"
- **Variant**: Secondary (`<Link>`).
- **Trigger**: One per step card on the overview grid.
- **Workflow**: Navigates to `step.href`. The card itself shows the step label, status badge, and a short summary (e.g. "3 of 5 devices connected").
- **Disabled when**: Never.
- **Why it exists**: Lets the user jump into any step out-of-order, not just the next incomplete one.
