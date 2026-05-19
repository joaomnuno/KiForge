import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AppScaffold } from "../../components/layout/AppScaffold";
import { Button } from "../../components/ui/Button";
import { Panel } from "../../components/ui/Panel";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { catalog } from "../catalog/catalog";
import { useWorkspaceStore } from "../projects/project-store";

export function ComponentsPage() {
  const currentProject = useWorkspaceStore((state) => state.currentProject);
  const isLoading = useWorkspaceStore((state) => state.isLoading);
  const isSaving = useWorkspaceStore((state) => state.isSaving);
  const errorMessage = useWorkspaceStore((state) => state.errorMessage);
  const addComponentToCurrentProject = useWorkspaceStore(
    (state) => state.addComponentToCurrentProject
  );
  const saveCurrentProject = useWorkspaceStore(
    (state) => state.saveCurrentProject
  );
  const [activeCategoryId, setActiveCategoryId] = useState(
    catalog.categories[0]?.id ?? ""
  );

  const visibleEntries = useMemo(
    () =>
      catalog.components.filter(
        (entry) => entry.categoryId === activeCategoryId
      ),
    [activeCategoryId]
  );

  if (!currentProject) {
    return (
      <AppScaffold
        activeNav="library"
        searchPlaceholder="Search components, packages, or protocols..."
      >
        <Panel
          title={isLoading ? "Loading workspace" : "No project selected"}
          description={
            isLoading
              ? "Reading your current project definition."
              : "Open a project or create a new one before adding devices."
          }
        >
          <div className="button-group">
            <Link className="button button--primary" to="/projects">
              Go to Projects
            </Link>
          </div>
        </Panel>
      </AppScaffold>
    );
  }

  return (
    <AppScaffold
      activeNav="library"
      searchPlaceholder="Search components, packages, or protocols..."
      projectStrip={{
        name: currentProject.name,
        controller: currentProject.controller.name,
        status: currentProject.status,
        voltageDomain: currentProject.voltageDomain,
        onSave: () => void saveCurrentProject(),
        isSaving
      }}
      inspector={
        <>
          <Panel
            eyebrow="Selected project components"
            title={`${currentProject.components.length} devices in scope`}
            description="Instance naming is stored with the project so the logical inventory survives reloads."
          >
            {currentProject.components.length === 0 ? (
              <p>No devices have been added yet.</p>
            ) : (
              <ul className="list-reset stack-sm">
                {currentProject.components.map((component) => (
                  <li key={component.id} className="component-list-item">
                    <div>
                      <strong>{component.instanceName}</strong>
                      <span>{component.partName}</span>
                    </div>
                    <StatusBadge label={component.status} />
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel
            eyebrow="Next step"
            title="Move to connection planning"
            description="Once the inventory is stable, define logical protocols, controller interfaces, and pin mappings."
          >
            <Link
              className="button button--primary button--block"
              to="/workspace/connections"
            >
              Continue to connections
            </Link>
          </Panel>
        </>
      }
    >
      <div className="components-layout">
        <Panel eyebrow="Library categories" title="Browse by device role">
          <div className="category-list">
            {catalog.categories.map((category) => (
              <button
                key={category.id}
                className={
                  category.id === activeCategoryId
                    ? "category-item category-item--active"
                    : "category-item"
                }
                onClick={() => setActiveCategoryId(category.id)}
                type="button"
              >
                {category.label}
              </button>
            ))}
          </div>
        </Panel>

        <Panel
          eyebrow="Component library"
          title="Available parts"
          description="A curated catalog of devices ready to drop into your project."
        >
          {errorMessage ? <p className="form-note">{errorMessage}</p> : null}
          <div className="library-grid">
            {visibleEntries.map((entry) => (
              <article key={entry.id} className="library-card">
                <div className="library-card__header">
                  <div>
                    <h3>{entry.name}</h3>
                    <p>{entry.summary}</p>
                  </div>
                  <Button
                    disabled={isSaving}
                    onClick={() => void addComponentToCurrentProject(entry.id)}
                    type="button"
                    variant="secondary"
                  >
                    Add
                  </Button>
                </div>
                <dl className="stats-grid">
                  <div>
                    <dt>Voltage</dt>
                    <dd>{entry.voltage}</dd>
                  </div>
                  <div>
                    <dt>Package</dt>
                    <dd>{entry.packageName}</dd>
                  </div>
                </dl>
                <div className="chip-row">
                  {entry.supportedProtocols.map((protocol) => (
                    <span key={protocol} className="chip">
                      {protocol}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </Panel>
      </div>
    </AppScaffold>
  );
}
