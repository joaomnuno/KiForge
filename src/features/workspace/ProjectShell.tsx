import { useCallback, useMemo, useState, type ReactNode } from "react";
import { Link, Navigate, Outlet } from "react-router-dom";
import clsx from "clsx";
import { Button } from "../../components/ui/Button";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { Tooltip } from "../../components/ui/Tooltip";
import { isTauriRuntime } from "../../lib/runtime";
import {
  pickExportDestination,
  rememberExportDestination
} from "../export/export-destination";
import { useWorkspaceStore } from "../projects/project-store";
import {
  deriveProjectStatus,
  getProjectProgress
} from "../projects/project-progress";
import { ProjectProgressStrip } from "./ProjectProgressStrip";
import type { ProjectShellContext } from "./project-shell-context";
import "./ProjectShell.css";

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
  const isDesktopRuntime = isTauriRuntime();

  if (currentProject == null) {
    return <Navigate to="/projects" replace />;
  }

  const progress = getProjectProgress(currentProject, exportResult);
  const derivedStatus = deriveProjectStatus(
    progress,
    Boolean(currentProject.lastExportedAt)
  );
  const canExport = progress.steps.every(
    (step) => step.id === "export" || step.status === "complete"
  );
  const canExportInRuntime = isDesktopRuntime && canExport;
  const exportBlockReason = !isDesktopRuntime
    ? "Open the desktop app to export KiCad bundles."
    : !canExport
      ? "Resolve every step (no errors, every device connected) before exporting"
      : isExporting
        ? "Export is already running"
        : null;
  const handleExportClick = async () => {
    if (!canExportInRuntime) {
      return;
    }
    const destination = await pickExportDestination();
    if (destination == null) {
      return;
    }
    const result = await exportKicadBundleForCurrentProject(destination);
    if (result != null) {
      rememberExportDestination(destination);
    }
  };

  const exportButton = (
    <Button
      variant="primary"
      disabled={!canExportInRuntime || isExporting}
      onClick={() => {
        void handleExportClick();
      }}
      title={
        !isDesktopRuntime
          ? "Open the desktop app to export KiCad bundles."
          : canExport
            ? "Pick a folder and write the KiCad starter bundle into it"
            : "Resolve every step (no errors, every device connected) before exporting"
      }
    >
      {isExporting ? "Exporting..." : "Export KiCad bundle..."}
    </Button>
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
          {exportBlockReason ? (
            <Tooltip content={exportBlockReason} side="bottom">
              <span
                aria-label="Export KiCad bundle"
                className="tooltip__trigger-wrapper tooltip__trigger-wrapper--disabled"
                tabIndex={0}
              >
                {exportButton}
              </span>
            </Tooltip>
          ) : (
            exportButton
          )}
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
