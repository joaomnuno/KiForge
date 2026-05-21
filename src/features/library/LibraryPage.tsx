import { useMemo, useState } from "react";
import { AppScaffold } from "../../components/layout/AppScaffold";
import { Panel } from "../../components/ui/Panel";
import { catalog } from "../catalog/catalog";

const ALL_CATEGORY_ID = "__all__";

/**
 * Global, project-independent catalog browser.
 *
 * Reachable via the sidebar's "Library" nav. Shows every controller and
 * every component shipped under `catalog/`. Distinct from
 * `/workspace/components`, which only operates on the active project.
 */
export function LibraryPage() {
  const [activeCategoryId, setActiveCategoryId] =
    useState<string>(ALL_CATEGORY_ID);
  const [search, setSearch] = useState("");

  const normalizedSearch = search.trim().toLowerCase();
  const visibleComponents = useMemo(() => {
    return catalog.components.filter((entry) => {
      if (
        activeCategoryId !== ALL_CATEGORY_ID &&
        entry.categoryId !== activeCategoryId
      ) {
        return false;
      }
      if (!normalizedSearch) {
        return true;
      }
      const haystack = [
        entry.name,
        entry.id,
        entry.summary,
        entry.packageName,
        entry.voltage,
        ...entry.supportedProtocols
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(normalizedSearch);
    });
  }, [activeCategoryId, normalizedSearch]);

  const controllerCount = catalog.controllers.length;
  const componentCount = catalog.components.length;

  return (
    <AppScaffold
      activeNav="library"
      searchPlaceholder="Search controllers and components..."
    >
      <div className="page-stack">
        <section className="page-hero">
          <div>
            <p className="eyebrow">Catalog</p>
            <h1 className="page-title">Library</h1>
            <p className="page-subtitle">
              Every controller and peripheral KiForge ships, browsable without
              opening a project.
            </p>
          </div>
          <div className="library-summary">
            <span>
              <strong>{controllerCount}</strong> controllers
            </span>
            <span>
              <strong>{componentCount}</strong> components
            </span>
          </div>
        </section>

        <Panel
          eyebrow="Controllers"
          title="Supported MCUs"
          description="Open a project and pick one of these on New Project."
        >
          <div className="library-grid">
            {catalog.controllers.map((controller) => (
              <article key={controller.id} className="library-card">
                <div className="library-card__header">
                  <div>
                    <h3>{controller.name}</h3>
                    <p>{controller.notes || "—"}</p>
                  </div>
                </div>
                <dl className="stats-grid">
                  <div>
                    <dt>Package</dt>
                    <dd>{controller.packageName}</dd>
                  </div>
                  <div>
                    <dt>Voltage</dt>
                    <dd>{controller.voltage}</dd>
                  </div>
                  <div>
                    <dt>Interfaces</dt>
                    <dd>{controller.interfaces.length}</dd>
                  </div>
                  <div>
                    <dt>GPIO pins</dt>
                    <dd>{controller.gpioPins.length}</dd>
                  </div>
                </dl>
                <div className="chip-row">
                  {controller.protocols.map((protocol) => (
                    <span key={protocol} className="chip">
                      {protocol}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </Panel>

        <Panel
          eyebrow="Components"
          title="Peripherals and modules"
          description="Filter by category or search. Adding a part still happens from inside a project."
        >
          <div className="library-controls">
            <div className="filter-row">
              <button
                key={ALL_CATEGORY_ID}
                className={
                  activeCategoryId === ALL_CATEGORY_ID
                    ? "filter-pill filter-pill--active"
                    : "filter-pill"
                }
                onClick={() => setActiveCategoryId(ALL_CATEGORY_ID)}
                type="button"
              >
                All
              </button>
              {catalog.categories.map((category) => (
                <button
                  key={category.id}
                  className={
                    category.id === activeCategoryId
                      ? "filter-pill filter-pill--active"
                      : "filter-pill"
                  }
                  onClick={() => setActiveCategoryId(category.id)}
                  type="button"
                >
                  {category.label}
                </button>
              ))}
            </div>
            <label className="library-search">
              <span className="visually-hidden">Search components</span>
              <input
                className="field__control"
                type="search"
                placeholder="Search by name, package, protocol..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>
          </div>

          {visibleComponents.length === 0 ? (
            <p className="form-note">
              No components match the current filter
              {normalizedSearch ? ` and search "${search.trim()}"` : ""}.
            </p>
          ) : (
            <div className="library-grid">
              {visibleComponents.map((entry) => (
                <article key={entry.id} className="library-card">
                  <div className="library-card__header">
                    <div>
                      <h3>{entry.name}</h3>
                      <p>{entry.summary}</p>
                    </div>
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
                    {entry.i2cAddress ? (
                      <div>
                        <dt>I2C address</dt>
                        <dd>{entry.i2cAddress}</dd>
                      </div>
                    ) : null}
                    <div>
                      <dt>Category</dt>
                      <dd>{entry.categoryLabel}</dd>
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
          )}
        </Panel>
      </div>
    </AppScaffold>
  );
}
