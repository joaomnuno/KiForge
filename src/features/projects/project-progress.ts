import type {
  ProjectExportResult,
  ProjectStatus,
  WorkspaceProject
} from "../../types/domain";

export type ProjectStepId =
  | "identity"
  | "components"
  | "connections"
  | "pin-mapping"
  | "validation"
  | "export";

export type ProjectStepStatus = "complete" | "attention" | "empty" | "blocked";

export interface ProjectStepProgress {
  id: ProjectStepId;
  label: string;
  status: ProjectStepStatus;
  summary: string;
  href: string;
}

export interface ProjectProgress {
  steps: ProjectStepProgress[];
  completedCount: number;
  totalCount: number;
  nextStepId: ProjectStepId | null;
  percentComplete: number;
}

const TOTAL_STEPS = 6;

function buildIdentityStep(
  project: WorkspaceProject | null
): ProjectStepProgress {
  if (!project) {
    return {
      id: "identity",
      label: "Identity",
      status: "empty",
      summary: "Project not opened",
      href: "/workspace/overview"
    };
  }

  return {
    id: "identity",
    label: "Identity",
    status: "complete",
    summary: `${project.controller.name} · ${project.voltageDomain}`,
    href: "/workspace/overview"
  };
}

function buildComponentsStep(
  project: WorkspaceProject | null
): ProjectStepProgress {
  if (!project) {
    return {
      id: "components",
      label: "Components",
      status: "empty",
      summary: "0 device(s) in scope",
      href: "/workspace/components"
    };
  }

  const count = project.components.length;
  const status: ProjectStepStatus = count >= 1 ? "complete" : "empty";

  return {
    id: "components",
    label: "Components",
    status,
    summary: `${count} device(s) in scope`,
    href: "/workspace/components"
  };
}

function buildConnectionsStep(
  project: WorkspaceProject | null
): ProjectStepProgress {
  if (!project) {
    return {
      id: "connections",
      label: "Connections",
      status: "empty",
      summary: "0 of 0 devices connected",
      href: "/workspace/connections"
    };
  }

  const totalComponents = project.components.length;
  const connectedComponentIds = new Set(
    project.connections.map((connection) => connection.componentId)
  );
  const connectedCount = project.components.filter((component) =>
    connectedComponentIds.has(component.id)
  ).length;

  let status: ProjectStepStatus;
  if (totalComponents === 0 || project.connections.length === 0) {
    status = "empty";
  } else if (connectedCount === totalComponents) {
    status = "complete";
  } else {
    status = "attention";
  }

  return {
    id: "connections",
    label: "Connections",
    status,
    summary: `${connectedCount} of ${totalComponents} devices connected`,
    href: "/workspace/connections"
  };
}

function buildPinMappingStep(
  project: WorkspaceProject | null
): ProjectStepProgress {
  if (!project || project.connections.length === 0) {
    return {
      id: "pin-mapping",
      label: "Pin mapping",
      status: "empty",
      summary: "No connections yet",
      href: "/workspace/connections"
    };
  }

  const assignments = project.connections.flatMap(
    (connection) => connection.assignments
  );

  const conflictCount = assignments.filter(
    (assignment) => assignment.status === "Conflict"
  ).length;
  const needsConfirmationCount = assignments.filter(
    (assignment) => assignment.status === "Needs confirmation"
  ).length;

  if (conflictCount > 0) {
    return {
      id: "pin-mapping",
      label: "Pin mapping",
      status: "blocked",
      summary: `${conflictCount} signal conflict(s)`,
      href: "/workspace/connections"
    };
  }

  if (needsConfirmationCount > 0) {
    return {
      id: "pin-mapping",
      label: "Pin mapping",
      status: "attention",
      summary: `${needsConfirmationCount} signal(s) need confirmation`,
      href: "/workspace/connections"
    };
  }

  return {
    id: "pin-mapping",
    label: "Pin mapping",
    status: "complete",
    summary: "All signals valid",
    href: "/workspace/connections"
  };
}

function buildValidationStep(
  project: WorkspaceProject | null
): ProjectStepProgress {
  if (!project) {
    return {
      id: "validation",
      label: "Validation",
      status: "empty",
      summary: "No issues",
      href: "/workspace/overview"
    };
  }

  const errorCount = project.issues.filter(
    (issue) => issue.severity === "error"
  ).length;
  const warningCount = project.issues.filter(
    (issue) => issue.severity === "warning"
  ).length;

  let status: ProjectStepStatus;
  if (errorCount > 0) {
    status = "blocked";
  } else if (warningCount > 0) {
    status = "attention";
  } else {
    status = "complete";
  }

  const summary =
    project.issues.length === 0
      ? "No issues"
      : `${errorCount} error(s), ${warningCount} warning(s)`;

  return {
    id: "validation",
    label: "Validation",
    status,
    summary,
    href: "/workspace/overview"
  };
}

function buildExportStep(
  project: WorkspaceProject | null,
  exportResult: ProjectExportResult | null | undefined
): ProjectStepProgress {
  if (exportResult && project && exportResult.projectId === project.id) {
    return {
      id: "export",
      label: "Export",
      status: "complete",
      summary: `Exported ${exportResult.fileName}`,
      href: "/workspace/overview"
    };
  }

  if (project?.lastExportedAt) {
    return {
      id: "export",
      label: "Export",
      status: "complete",
      summary: "Exported previously",
      href: "/workspace/overview"
    };
  }

  return {
    id: "export",
    label: "Export",
    status: "empty",
    summary: "Not exported yet",
    href: "/workspace/overview"
  };
}

export function getProjectProgress(
  project: WorkspaceProject | null,
  exportResult?: ProjectExportResult | null
): ProjectProgress {
  if (!project) {
    const steps: ProjectStepProgress[] = [
      buildIdentityStep(null),
      buildComponentsStep(null),
      buildConnectionsStep(null),
      buildPinMappingStep(null),
      buildValidationStep(null),
      buildExportStep(null, exportResult ?? null)
    ];

    return {
      steps,
      completedCount: 0,
      totalCount: TOTAL_STEPS,
      nextStepId: "identity",
      percentComplete: 0
    };
  }

  const steps: ProjectStepProgress[] = [
    buildIdentityStep(project),
    buildComponentsStep(project),
    buildConnectionsStep(project),
    buildPinMappingStep(project),
    buildValidationStep(project),
    buildExportStep(project, exportResult ?? null)
  ];

  const completedCount = steps.filter(
    (step) => step.status === "complete"
  ).length;
  const nextStep = steps.find((step) => step.status !== "complete");
  const percentComplete = Math.round((completedCount / TOTAL_STEPS) * 100);

  return {
    steps,
    completedCount,
    totalCount: TOTAL_STEPS,
    nextStepId: nextStep ? nextStep.id : null,
    percentComplete
  };
}

/**
 * Derive the user-facing `ProjectStatus` badge from observable step
 * progress (and whether the project has ever produced an export).
 *
 * Roadmap P0 mandates that status be derived from real state instead
 * of the stored `ProjectDocument.status` value that earlier UI flows
 * let users edit. Wire this in front of the stored field as the
 * project list / cards migrate.
 *
 * Precedence:
 *   any step blocked       → "Has Conflicts"
 *   all 6 complete + export → "Generated"
 *   all 6 complete          → "Ready to Generate"
 *   pin-mapping attention   → "Pin Mapping Incomplete"
 *   at least one connection → "Connections Defined"
 *   at least one component  → "Components Selected"
 *   otherwise               → "Draft"
 */
export function deriveProjectStatus(
  progress: ProjectProgress,
  hasExported: boolean
): ProjectStatus {
  const stepById = new Map(progress.steps.map((step) => [step.id, step]));
  const hasBlocked = progress.steps.some((step) => step.status === "blocked");
  if (hasBlocked) {
    return "Has Conflicts";
  }
  const allComplete = progress.completedCount === progress.totalCount;
  if (allComplete && hasExported) {
    return "Generated";
  }
  if (allComplete) {
    return "Ready to Generate";
  }
  if (stepById.get("pin-mapping")?.status === "attention") {
    return "Pin Mapping Incomplete";
  }
  const connectionsStep = stepById.get("connections");
  if (
    connectionsStep &&
    connectionsStep.status !== "empty" &&
    connectionsStep.status !== "blocked"
  ) {
    return "Connections Defined";
  }
  const componentsStep = stepById.get("components");
  if (componentsStep?.status === "complete") {
    return "Components Selected";
  }
  return "Draft";
}
