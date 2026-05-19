import { NavLink } from "react-router-dom";
import type { ProjectProgress } from "../projects/project-progress";

interface ProjectProgressStripProps {
  progress: ProjectProgress;
}

export function ProjectProgressStrip({ progress }: ProjectProgressStripProps) {
  const seenHrefs = new Set<string>();
  const visibleSteps = progress.steps.filter((step) => {
    if (seenHrefs.has(step.href)) {
      return false;
    }
    seenHrefs.add(step.href);
    return true;
  });

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
        {visibleSteps.map((step) => (
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
              end
            >
              <span className="progress-strip__dot" aria-hidden />
              <span className="progress-strip__label">{step.label}</span>
              <span className="progress-strip__summary">{step.summary}</span>
            </NavLink>
          </li>
        ))}
      </ol>
    </nav>
  );
}
