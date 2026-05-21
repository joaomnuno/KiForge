import { useCallback, useMemo, useState, type ReactNode } from "react";
import { Link, Navigate, Outlet } from "react-router-dom";
import clsx from "clsx";
import { Button } from "../../components/ui/Button";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { useWorkspaceStore } from "../projects/project-store";
import {
  deriveProjectStatus,
  getProjectProgress
} from "../projects/project-progress";
import { ProjectProgressStrip } from "./ProjectProgressStrip";
import type { ProjectShellContext } from "./project-shell-context";

export function ProjectShell() {
  const currentProject = useWorkspaceStore((state) => state.currentProject);
  const isSaving = useWorkspaceStore((state) => state.isSaving);
  const isExporting = useWorkspaceStore((state) => state.isExporting);
  const exportResult = useWorkspaceStore((state) => state.exportResult);
  const saveCurrentProject = useWorkspaceStore(
    (state) => state.saveCurrentProject
  );
  const exportKicadBundleForCurrentProject = useWorkspaceStore(
    (state) => state.exportKicadBundleForCurrentProject
  );

  const [inspector, setInspectorState] = useState<ReactNode | null>(null);
  const setInspector = useCallback((node: ReactNode | null) => {
    setInspectorState(node);
  }, []);
  const context = useMemo<ProjectShellContext>(
    () => ({ setInspector }),
    [setInspector]
  );

  if (currentProject == null) {
    return <Navigate to="/projects" replace />;
  }

  const progress = getProjectProgress(currentProject, exportResult);
  const derivedStatus = deriveProjectStatus(
    progress,
    Boolean(currentProject.lastExportedAt)
  );
  // Gate the export button on every step EXCEPT export being complete.
  // (Gating on derivedStatus === "Ready to Generate" would be circular —
  // that status only resolves after an export already happened.)
  const canExport = progress.steps.every(
    (step) => step.id === "export" || step.status === "complete"
  );

  return (
    <div className="project-shell">
      <header className="project-shell__header">
        <div className="project-shell__identity">
          <Link to="/projects" className="project-shell__back">
            &larr; Projects
          </Link>
          <div>
            <h1>{currentProject.name}</h1>
            <p>
              {currentProject.controller.name} &middot;{" "}
              {currentProject.voltageDomain} domain
            </p>
          </div>
        </div>
        <div className="project-shell__actions">
          <StatusBadge label={derivedStatus} />
          <Button variant="secondary" onClick={() => void saveCurrentProject()}>
            {isSaving ? "Saving..." : "Save Project"}
          </Button>
          <Button
            variant="primary"
            disabled={!canExport || isExporting}
            onClick={() => void exportKicadBundleForCurrentProject()}
            title={
              canExport
                ? "Write the KiCad starter bundle into the project's kicad/ directory"
                : "Resolve every step (no errors, every device connected) before exporting"
            }
          >
            {isExporting ? "Exporting..." : "Export KiCad bundle"}
          </Button>
        </div>
      </header>

      <ProjectProgressStrip progress={progress} />

      <main
        className={clsx(
          "project-shell__main",
          inspector != null && "project-shell__main--with-inspector"
        )}
      >
        <div className="project-shell__content">
          <Outlet context={context} />
        </div>
        {inspector != null && (
          <aside
            className="project-shell__inspector"
            aria-label="Project inspector"
          >
            {inspector}
          </aside>
        )}
      </main>
    </div>
  );
}
