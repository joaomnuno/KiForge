import { Button } from "../ui/Button";
import { StatusBadge } from "../ui/StatusBadge";

interface ProjectStripProps {
  name: string;
  controller: string;
  status: string;
  voltageDomain: string;
  onSave?: () => void;
  isSaving?: boolean;
}

export function ProjectStrip({
  name,
  controller,
  status,
  voltageDomain,
  onSave,
  isSaving = false
}: ProjectStripProps) {
  return (
    <div className="project-strip">
      <div className="project-strip__meta">
        <h1>{name}</h1>
        <p>
          {controller} | {voltageDomain} domain
        </p>
      </div>
      <div className="project-strip__stats">
        <StatusBadge label={status} />
        {onSave ? (
          <Button onClick={onSave} type="button" variant="secondary">
            {isSaving ? "Saving..." : "Save Project"}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
