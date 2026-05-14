import { Link, useNavigate } from "react-router-dom";
import { AppScaffold } from "../../components/layout/AppScaffold";
import { Button } from "../../components/ui/Button";
import { Panel } from "../../components/ui/Panel";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { formatTimestamp } from "../../lib/date-format";
import { useWorkspaceStore } from "./project-store";

const filterPills = [
  "All Projects",
  "Recent",
  "Favorites",
  "Templates",
  "Ready to generate"
] as const;

export function ProjectsPage() {
  const navigate = useNavigate();
  const projects = useWorkspaceStore((state) => state.projects);
  const isLoading = useWorkspaceStore((state) => state.isLoading);
  const isSaving = useWorkspaceStore((state) => state.isSaving);
  const isExporting = useWorkspaceStore((state) => state.isExporting);
  const errorMessage = useWorkspaceStore((state) => state.errorMessage);
  const exportResult = useWorkspaceStore((state) => state.exportResult);
  const openProject = useWorkspaceStore((state) => state.openProject);
  const renameProject = useWorkspaceStore((state) => state.renameProject);
  const duplicateProject = useWorkspaceStore((state) => state.duplicateProject);
  const deleteProject = useWorkspaceStore((state) => state.deleteProject);
  const exportProject = useWorkspaceStore((state) => state.exportProject);
  const isBusy = isSaving || isExporting;

  async function handleOpenProject(projectId: string) {
    await openProject(projectId);
    if (useWorkspaceStore.getState().activeProjectId === projectId) {
      navigate("/workspace/components");
    }
  }

  async function handleRenameProject(projectId: string, projectName: string) {
    const nextName = window.prompt("Rename project", projectName);
    if (!nextName) {
      return;
    }

    await renameProject(projectId, nextName);
  }

  async function handleDuplicateProject(
    projectId: string,
    projectName: string
  ) {
    const nextName = window.prompt(
      "Duplicate project as",
      `${projectName} Copy`
    );
    await duplicateProject(projectId, nextName ?? undefined);
  }

  async function handleDeleteProject(projectId: string, projectName: string) {
    const confirmed = window.confirm(`Delete "${projectName}"?`);
    if (!confirmed) {
      return;
    }

    await deleteProject(projectId);
  }

  async function handleExportProject(projectId: string) {
    await exportProject(projectId);
  }

  return (
    <AppScaffold
      activeNav="projects"
      searchPlaceholder="Search projects, MCUs, peripherals..."
      inspector={
        <>
          <Panel
            eyebrow="Status legend"
            title="Progress at a glance"
            description="Project cards mirror these statuses so unfinished work is visible before opening a workspace."
          >
            <div className="stack-sm">
              <StatusBadge label="Components Selected" />
              <StatusBadge label="Pin Mapping Incomplete" />
              <StatusBadge label="Ready to Generate" />
              <StatusBadge label="Has Conflicts" />
            </div>
          </Panel>

          <Panel
            eyebrow="Starter templates"
            title="Suggested first-run projects"
            description="Templates are still static, but the project list now loads from persisted local data."
          >
            <ul className="list-reset stack-sm">
              <li className="inspector-row">
                <strong>STM32 sensor node</strong>
                <span>MCU + flash + IMU + barometer</span>
              </li>
              <li className="inspector-row">
                <strong>RP2040 utility board</strong>
                <span>USB + UART bridge + GPIO header</span>
              </li>
              <li className="inspector-row">
                <strong>ESP32 data logger</strong>
                <span>Wireless + storage + debug console</span>
              </li>
            </ul>
          </Panel>
        </>
      }
    >
      <div className="page-stack">
        <section className="page-hero">
          <div>
            <p className="eyebrow">Project workspace</p>
            <h1 className="page-title">My Projects</h1>
            <p className="page-subtitle">
              Create and manage hardware starter projects before opening KiCad.
            </p>
          </div>
          <Link className="button button--primary" to="/projects/new">
            Start a new design
          </Link>
        </section>

        {errorMessage ? (
          <Panel>
            <p className="form-note">{errorMessage}</p>
          </Panel>
        ) : null}

        {exportResult ? (
          <Panel title="Export ready" description={exportResult.message}>
            {exportResult.kind === "download-url" ? (
              <div className="button-group">
                <a
                  className="button button--secondary"
                  download={exportResult.fileName}
                  href={exportResult.target}
                >
                  Download JSON
                </a>
              </div>
            ) : null}
          </Panel>
        ) : null}

        <div className="filter-row">
          {filterPills.map((pill, index) => (
            <button
              key={pill}
              className={
                index === 0 ? "filter-pill filter-pill--active" : "filter-pill"
              }
              type="button"
            >
              {pill}
            </button>
          ))}
        </div>

        {isLoading && projects.length === 0 ? (
          <Panel
            title="Loading projects"
            description="Reading local project files now."
          />
        ) : null}

        {!isLoading && projects.length === 0 ? (
          <Panel
            title="No projects yet"
            description="Create your first hardware starter project, choose a controller, and begin defining the device inventory."
          >
            <div className="button-group">
              <Link className="button button--primary" to="/projects/new">
                Create New Project
              </Link>
            </div>
          </Panel>
        ) : null}

        {projects.length > 0 ? (
          <section className="cards-grid">
            {projects.map((project) => (
              <article key={project.id} className="project-card">
                <div className="project-card__header">
                  <div>
                    <p className="eyebrow">Project</p>
                    <h2>{project.name}</h2>
                  </div>
                  <StatusBadge label={project.status} />
                </div>

                <p className="project-card__summary">{project.summary}</p>

                <dl className="stats-grid">
                  <div>
                    <dt>Controller</dt>
                    <dd>{project.controller}</dd>
                  </div>
                  <div>
                    <dt>Devices</dt>
                    <dd>{project.deviceCount}</dd>
                  </div>
                  <div>
                    <dt>Interfaces</dt>
                    <dd>{project.interfaceCount}</dd>
                  </div>
                  <div>
                    <dt>Updated</dt>
                    <dd>{formatTimestamp(project.updatedAt)}</dd>
                  </div>
                </dl>

                <div className="project-card__actions button-group">
                  <Button
                    disabled={isBusy}
                    onClick={() => void handleOpenProject(project.id)}
                    type="button"
                    variant="secondary"
                  >
                    Open
                  </Button>
                  <Button
                    disabled={isBusy}
                    onClick={() =>
                      void handleDuplicateProject(project.id, project.name)
                    }
                    type="button"
                    variant="ghost"
                  >
                    Duplicate
                  </Button>
                  <Button
                    disabled={isBusy}
                    onClick={() => void handleExportProject(project.id)}
                    type="button"
                    variant="ghost"
                  >
                    Export
                  </Button>
                  <Button
                    disabled={isBusy}
                    onClick={() =>
                      void handleRenameProject(project.id, project.name)
                    }
                    type="button"
                    variant="ghost"
                  >
                    Rename
                  </Button>
                  <Button
                    disabled={isBusy}
                    onClick={() =>
                      void handleDeleteProject(project.id, project.name)
                    }
                    type="button"
                    variant="ghost"
                  >
                    Delete
                  </Button>
                </div>
              </article>
            ))}
          </section>
        ) : null}
      </div>
    </AppScaffold>
  );
}
