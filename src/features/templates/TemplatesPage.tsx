import { useNavigate } from "react-router-dom";
import { AppScaffold } from "../../components/layout/AppScaffold";
import { Button } from "../../components/ui/Button";
import { Panel } from "../../components/ui/Panel";
import { catalog } from "../catalog/catalog";
import { projectTemplates } from "./templates-catalog";

export function TemplatesPage() {
  const navigate = useNavigate();

  function handleUseTemplate(templateId: string) {
    navigate("/projects/new", { state: { templateId } });
  }

  return (
    <AppScaffold
      activeNav="templates"
      searchPlaceholder="Search starter templates..."
      inspector={
        <>
          <Panel
            eyebrow="What templates do"
            title="Skip the blank slate"
            description="Each template preselects a controller, voltage domain, and a curated device list so you can move straight to pin planning."
          >
            <ul className="list-reset stack-sm">
              <li className="inspector-row">
                <strong>Controller defaults</strong>
                <span>Pulled from the local controller catalog.</span>
              </li>
              <li className="inspector-row">
                <strong>Suggested devices</strong>
                <span>Added to the project after you confirm.</span>
              </li>
              <li className="inspector-row">
                <strong>Output target</strong>
                <span>Defaults to a KiCad starter project bundle.</span>
              </li>
            </ul>
          </Panel>

          <Panel
            eyebrow="Bring your own"
            title="Need something custom?"
            description="Start from the blank project and add devices manually from the Library."
          >
            <div className="button-group">
              <Button
                onClick={() => handleUseTemplate("blank-project")}
                type="button"
                variant="secondary"
              >
                Start blank
              </Button>
            </div>
          </Panel>
        </>
      }
    >
      <div className="page-stack">
        <section className="page-hero">
          <div>
            <p className="eyebrow">Starter templates</p>
            <h1 className="page-title">Templates</h1>
            <p className="page-subtitle">
              Pick a curated starting point and tweak it before saving the
              project.
            </p>
          </div>
        </section>

        <section className="cards-grid">
          {projectTemplates.map((template) => {
            const controller = catalog.controllers.find(
              (entry) => entry.id === template.controllerId
            );
            const componentNames = template.componentCatalogIds
              .map(
                (componentId) =>
                  catalog.components.find((entry) => entry.id === componentId)
                    ?.name ?? componentId
              )
              .join(", ");

            return (
              <article key={template.id} className="project-card">
                <div className="project-card__header">
                  <div>
                    <p className="eyebrow">{template.highlight}</p>
                    <h2>{template.name}</h2>
                  </div>
                  <div className="chip-row">
                    {template.tags.map((tag) => (
                      <span key={tag} className="chip">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <p className="project-card__summary">{template.description}</p>

                <dl className="stats-grid">
                  <div>
                    <dt>Controller</dt>
                    <dd>{controller?.name ?? template.controllerId}</dd>
                  </div>
                  <div>
                    <dt>Voltage</dt>
                    <dd>{template.voltageDomain}</dd>
                  </div>
                  <div>
                    <dt>Devices</dt>
                    <dd>
                      {template.componentCatalogIds.length === 0
                        ? "None preselected"
                        : componentNames}
                    </dd>
                  </div>
                  <div>
                    <dt>Output</dt>
                    <dd>{template.outputTarget}</dd>
                  </div>
                </dl>

                <div className="project-card__actions button-group">
                  <Button
                    onClick={() => handleUseTemplate(template.id)}
                    type="button"
                  >
                    Use template
                  </Button>
                </div>
              </article>
            );
          })}
        </section>
      </div>
    </AppScaffold>
  );
}
