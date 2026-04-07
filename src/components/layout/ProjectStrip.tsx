import { StatusBadge } from "../ui/StatusBadge";

interface ProjectStripProps {
  name: string;
  controller: string;
  status: string;
  voltageDomain: string;
}

export function ProjectStrip({
  name,
  controller,
  status,
  voltageDomain
}: ProjectStripProps) {
  return (
    <div className="project-strip">
      <div className="project-strip__meta">
        <h1>{name}</h1>
        <p>
          {controller} · {voltageDomain} domain
        </p>
      </div>
      <div className="project-strip__stats">
        <StatusBadge label={status} />
      </div>
    </div>
  );
}
