# Project overview — Resume {next step}

- **Location**: [src/features/workspace/ProjectOverviewPage.tsx](../../src/features/workspace/ProjectOverviewPage.tsx)
- **Label**: `Resume {nextStep.label}` — e.g. "Resume Components", "Resume Connections", "Resume Pin mapping".
- **Variant**: Primary (`<Link>` styled with `button button--primary`).
- **Trigger**: Shown only when `progress.nextStepId` is set (i.e. at least one step is not yet complete).
- **Workflow**: Navigates to `nextStep.href` — the first non-complete step's route.
- **Disabled when**: Hidden when all steps are complete (replaced with an "All steps complete." note).
- **Why it exists**: Single-click continuation of the most relevant unfinished work.
