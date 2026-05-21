import { Link } from "react-router-dom";
import { Panel } from "../../components/ui/Panel";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { useWorkspaceStore } from "../projects/project-store";
import {
  deriveProjectStatus,
  getProjectProgress
} from "../projects/project-progress";

export function ProjectOverviewPage() {
  const currentProject = useWorkspaceStore((state) => state.currentProject);
  const exportResult = useWorkspaceStore((state) => state.exportResult);

  if (!currentProject) {
    return null;
  }

  const progress = getProjectProgress(currentProject, exportResult);
  const projectStatus = deriveProjectStatus(
    progress,
    Boolean(currentProject.lastExportedAt)
  );
  const nextStep = progress.nextStepId
    ? (progress.steps.find((step) => step.id === progress.nextStepId) ?? null)
    : null;

  const errorCount = currentProject.issues.filter(
    (issue) => issue.severity === "error"
  ).length;
  const warningCount = currentProject.issues.filter(
    (issue) => issue.severity === "warning"
  ).length;
  const totalIssues = currentProject.issues.length;

  return (
    <div className="page-stack">
      <Panel
        eyebrow="Project overview"
        title={currentProject.name}
        description={
          currentProject.description || "No project description yet."
        }
        headerActions={<StatusBadge label={projectStatus} />}
      >
        {nextStep ? (
          <div className="button-group">
            <Link className="button button--primary" to={nextStep.href}>
              Resume {nextStep.label}
            </Link>
          </div>
        ) : (
          <p className="planner-note">All steps complete.</p>
        )}
      </Panel>

      <Panel
        eyebrow="Progress"
        title="Steps"
        description="Each step links into the detailed workspace page."
      >
        <div className="cards-grid">
          {progress.steps.map((step) => (
            <article
              key={step.id}
              className={`step-card step-card--${step.status}`}
            >
              <div className="project-card__header">
                <div>
                  <p className="eyebrow">{step.id}</p>
                  <h3>{step.label}</h3>
                </div>
                <StatusBadge label={statusBadgeLabel(step.status)} />
              </div>
              <p className="project-card__summary">{step.summary}</p>
              <div className="project-card__actions">
                <Link className="button button--secondary" to={step.href}>
                  Open
                </Link>
              </div>
            </article>
          ))}
        </div>
      </Panel>

      <Panel
        eyebrow="At a glance"
        title="Workspace stats"
        description="High-level counts pulled from the active project document."
      >
        <dl className="stats-grid">
          <div>
            <dt>Devices</dt>
            <dd>{currentProject.components.length}</dd>
          </div>
          <div>
            <dt>Saved connections</dt>
            <dd>{currentProject.connections.length}</dd>
          </div>
          <div>
            <dt>Issues</dt>
            <dd>{totalIssues}</dd>
          </div>
          <div>
            <dt>Errors / Warnings</dt>
            <dd>
              {errorCount} / {warningCount}
            </dd>
          </div>
        </dl>
      </Panel>
    </div>
  );
}

function statusBadgeLabel(status: string): string {
  switch (status) {
    case "complete":
      return "Valid";
    case "attention":
      return "Needs confirmation";
    case "blocked":
      return "Conflict";
    case "empty":
    default:
      return "Unconnected";
  }
}
