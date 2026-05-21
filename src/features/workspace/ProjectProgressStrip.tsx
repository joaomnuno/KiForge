import { NavLink } from "react-router-dom";
import type {
  ProjectProgress,
  ProjectStepId
} from "../projects/project-progress";
import "./ProjectProgressStrip.css";

interface ProjectProgressStripProps {
  progress: ProjectProgress;
}

export function ProjectProgressStrip({ progress }: ProjectProgressStripProps) {
  return (
    <nav className="progress-strip" aria-label="Project progress">
      <div className="progress-strip__overall">
        <span className="progress-strip__percent">
          {progress.percentComplete}%
        </span>
        <span className="progress-strip__overall-label">
          {progress.completedCount} of {progress.totalCount} done
        </span>
      </div>
      <ol className="progress-strip__steps">
        {progress.steps.map((step) => {
          const routeHint = getStepRouteHint(step.id);
          return (
            <li
              key={step.id}
              className={`progress-strip__step progress-strip__step--${step.status}`}
            >
              <NavLink
                to={step.href}
                className={({ isActive }) =>
                  isActive
                    ? "progress-strip__link progress-strip__link--active"
                    : "progress-strip__link"
                }
                title={routeHint ?? undefined}
                end
              >
                <span className="progress-strip__dot" aria-hidden />
                <span className="progress-strip__label">{step.label}</span>
                <span className="progress-strip__summary">{step.summary}</span>
              </NavLink>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function getStepRouteHint(stepId: ProjectStepId): string | null {
  switch (stepId) {
    case "pin-mapping":
      return "Opens /workspace/connections for pin assignment.";
    case "validation":
      return "Opens /workspace/overview until Validation has its own screen.";
    default:
      return null;
  }
}
