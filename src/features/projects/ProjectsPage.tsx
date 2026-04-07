import { Link } from "react-router-dom";
import { AppScaffold } from "../../components/layout/AppScaffold";
import { Button } from "../../components/ui/Button";
import { Panel } from "../../components/ui/Panel";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { useWorkspaceStore } from "./project-store";

const filterPills = [
  "All Projects",
  "Recent",
  "Favorites",
  "Templates",
  "Ready to generate"
] as const;

export function ProjectsPage() {
  const projects = useWorkspaceStore((state) => state.projects);

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
            description="Keep these templates local and editable. They should become seeded JSON templates later."
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

        <div className="filter-row">
          {filterPills.map((pill, index) => (
            <button
              key={pill}
              className={index === 0 ? "filter-pill filter-pill--active" : "filter-pill"}
              type="button"
            >
              {pill}
            </button>
          ))}
        </div>

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
                  <dt>Last edited</dt>
                  <dd>{project.lastEdited}</dd>
                </div>
              </dl>

              <div className="project-card__actions">
                <Link className="button button--secondary" to="/workspace/components">
                  Open
                </Link>
                <Button variant="ghost" type="button">
                  Duplicate
                </Button>
              </div>
            </article>
          ))}
        </section>
      </div>
    </AppScaffold>
  );
}
