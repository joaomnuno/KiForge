import { useMemo, useState } from "react";
import { AppScaffold } from "../../components/layout/AppScaffold";
import { Button } from "../../components/ui/Button";
import { Panel } from "../../components/ui/Panel";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { currentWorkspace, libraryCategories, libraryEntries } from "../../data/mockData";

export function ComponentsPage() {
  const [activeCategoryId, setActiveCategoryId] = useState("sensors");

  const visibleEntries = useMemo(
    () =>
      libraryEntries.filter((entry) => entry.categoryId === activeCategoryId),
    [activeCategoryId]
  );

  return (
    <AppScaffold
      activeNav="library"
      searchPlaceholder="Search components, packages, or protocols..."
      projectStrip={{
        name: currentWorkspace.name,
        controller: currentWorkspace.controller.name,
        status: currentWorkspace.status,
        voltageDomain: currentWorkspace.voltageDomain
      }}
      inspector={
        <>
          <Panel
            eyebrow="Selected project components"
            title={`${currentWorkspace.components.length} devices in scope`}
            description="Instance naming is already separated from manufacturer part numbers."
          >
            <ul className="list-reset stack-sm">
              {currentWorkspace.components.map((component) => (
                <li key={component.id} className="component-list-item">
                  <div>
                    <strong>{component.instanceName}</strong>
                    <span>{component.partName}</span>
                  </div>
                  <StatusBadge label={component.status} />
                </li>
              ))}
            </ul>
          </Panel>

          <Panel
            eyebrow="Next step"
            title="Move to connection planning"
            description="Once the inventory is stable, define logical protocols, controller interfaces, and pin mappings."
          >
            <Button className="button--block">Continue to connections</Button>
          </Panel>
        </>
      }
    >
      <div className="components-layout">
        <Panel eyebrow="Library categories" title="Browse by device role">
          <div className="category-list">
            {libraryCategories.map((category) => (
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
          description="The MVP catalog is intentionally curated instead of pretending to be a full distributor database."
        >
          <div className="library-grid">
            {visibleEntries.map((entry) => (
              <article key={entry.id} className="library-card">
                <div className="library-card__header">
                  <div>
                    <h3>{entry.name}</h3>
                    <p>{entry.summary}</p>
                  </div>
                  <Button variant="secondary" type="button">
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
