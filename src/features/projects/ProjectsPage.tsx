import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AppScaffold } from "../../components/layout/AppScaffold";
import { Button } from "../../components/ui/Button";
import { ConfirmDialog } from "../../components/ui/Dialog";
import { Panel } from "../../components/ui/Panel";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { formatTimestamp } from "../../lib/date-format";
import type { WorkspaceProject } from "../../types/domain";
import { deriveProjectStatus, getProjectProgress } from "./project-progress";
import { useWorkspaceStore } from "./project-store";

const filterPills = ["All Projects", "Recent", "Ready to generate"] as const;
type ProjectFilter = (typeof filterPills)[number];

const RECENT_PROJECT_LIMIT = 5;

function getVisibleProjectStatus(project: WorkspaceProject) {
  return deriveProjectStatus(
    getProjectProgress(project),
    Boolean(project.lastExportedAt)
  );
}

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
  const [activeFilter, setActiveFilter] =
    useState<ProjectFilter>("All Projects");
  const [searchValue, setSearchValue] = useState("");
  const [pendingDelete, setPendingDelete] = useState<{
    projectId: string;
    projectName: string;
  } | null>(null);

  const normalizedSearch = searchValue.trim().toLowerCase();

  const filteredProjects = useMemo(() => {
    const projectsByFilter = (() => {
      switch (activeFilter) {
        case "Recent":
          return [...projects]
            .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
            .slice(0, RECENT_PROJECT_LIMIT);
        case "Ready to generate":
          return projects.filter(
            (project) =>
              getVisibleProjectStatus(project) === "Ready to Generate"
          );
        case "All Projects":
        default:
          return projects;
      }
    })();

    if (!normalizedSearch) {
      return projectsByFilter;
    }

    return projectsByFilter.filter((project) =>
      [project.name, project.id, project.controller.name, project.controller.id]
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch)
    );
  }, [activeFilter, normalizedSearch, projects]);

  const trimmedSearch = searchValue.trim();
  const hasSearch = trimmedSearch.length > 0;

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

  function handleDeleteProject(projectId: string, projectName: string) {
    setPendingDelete({ projectId, projectName });
  }

  async function confirmPendingDelete() {
    if (!pendingDelete) {
      return;
    }
    await deleteProject(pendingDelete.projectId);
  }

  async function handleExportProject(projectId: string) {
    await exportProject(projectId);
  }

  return (
    <AppScaffold
      activeNav="projects"
      searchPlaceholder="Search projects, controllers, or ids..."
      searchValue={searchValue}
      onSearchChange={setSearchValue}
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
            title="Skip the blank slate"
            description="Templates preselect a controller, voltage domain, and a suggested device list."
          >
            <ul className="list-reset stack-sm">
              <li className="inspector-row">
                <strong>STM32 flight controller</strong>
                <span>STM32F405 + IMU + barometer</span>
              </li>
              <li className="inspector-row">
                <strong>RP2040 utility board</strong>
                <span>USB bridge + debug header</span>
              </li>
              <li className="inspector-row">
                <strong>STM32H7 data logger</strong>
                <span>High-throughput logging + flash storage</span>
              </li>
            </ul>
            <div className="button-group">
              <Link className="button button--secondary" to="/templates">
                Browse templates
              </Link>
            </div>
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
          {filterPills.map((pill) => (
            <button
              key={pill}
              className={
                pill === activeFilter
                  ? "filter-pill filter-pill--active"
                  : "filter-pill"
              }
              onClick={() => setActiveFilter(pill)}
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

        {projects.length > 0 && filteredProjects.length === 0 ? (
          <Panel
            title={
              hasSearch
                ? `No projects match "${trimmedSearch}"`
                : `No projects match "${activeFilter}"`
            }
            description={
              hasSearch
                ? "Search checks project name, controller, and project id inside the active filter."
                : activeFilter === "Ready to generate"
                  ? "Finish pin mapping on a project to surface it here."
                  : "Try a different filter to see more projects."
            }
          >
            <div className="button-group">
              <Button
                onClick={() => {
                  if (hasSearch) {
                    setSearchValue("");
                    return;
                  }
                  setActiveFilter("All Projects");
                }}
                type="button"
                variant="secondary"
              >
                {hasSearch ? "Clear search" : "Show all projects"}
              </Button>
            </div>
          </Panel>
        ) : null}

        {filteredProjects.length > 0 ? (
          <section className="cards-grid">
            {filteredProjects.map((project) => (
              <article key={project.id} className="project-card">
                <div className="project-card__header">
                  <div>
                    <p className="eyebrow">Project</p>
                    <h2>{project.name}</h2>
                  </div>
                  <StatusBadge label={getVisibleProjectStatus(project)} />
                </div>

                <p className="project-card__summary">{project.description}</p>

                <dl className="stats-grid">
                  <div>
                    <dt>Controller</dt>
                    <dd>{project.controller.name}</dd>
                  </div>
                  <div>
                    <dt>Devices</dt>
                    <dd>{project.components.length}</dd>
                  </div>
                  <div>
                    <dt>Interfaces</dt>
                    <dd>{project.connections.length}</dd>
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
                      handleDeleteProject(project.id, project.name)
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
      <ConfirmDialog
        open={pendingDelete != null}
        onOpenChange={(open) => {
          if (!open) {
            setPendingDelete(null);
          }
        }}
        title={
          pendingDelete
            ? `Delete "${pendingDelete.projectName}"?`
            : "Delete project"
        }
        description="This permanently removes the project document and any saved KiCad bundle. The action cannot be undone."
        confirmLabel="Delete project"
        destructive
        busy={isBusy}
        onConfirm={confirmPendingDelete}
      />
    </AppScaffold>
  );
}
