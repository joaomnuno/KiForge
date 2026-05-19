import { useEffect, useMemo, useState } from "react";
import { Button } from "../../components/ui/Button";
import { Panel } from "../../components/ui/Panel";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { catalog } from "../catalog/catalog";
import { useWorkspaceStore } from "../projects/project-store";
import type { WorkspaceProjectComponent } from "../../types/domain";

export function ComponentsPage() {
  const currentProject = useWorkspaceStore((state) => state.currentProject);
  const isSaving = useWorkspaceStore((state) => state.isSaving);
  const errorMessage = useWorkspaceStore((state) => state.errorMessage);
  const addComponentToCurrentProject = useWorkspaceStore(
    (state) => state.addComponentToCurrentProject
  );
  const removeComponentFromCurrentProject = useWorkspaceStore(
    (state) => state.removeComponentFromCurrentProject
  );
  const renameComponentInCurrentProject = useWorkspaceStore(
    (state) => state.renameComponentInCurrentProject
  );
  const [activeCategoryId, setActiveCategoryId] = useState(
    catalog.categories[0]?.id ?? ""
  );

  const visibleEntries = useMemo(
    () => catalog.components.filter((entry) => entry.categoryId === activeCategoryId),
    [activeCategoryId]
  );

  if (!currentProject) {
    return null;
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
        gap: "var(--space-lg, 1.5rem)",
        alignItems: "start"
      }}
    >
      <div className="stack-lg">
        <Panel eyebrow="Library categories" title="Browse by role">
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

      <Panel
        eyebrow="Project inventory"
        title={`Devices in this project — ${currentProject.components.length}`}
      >
        {currentProject.components.length === 0 ? (
          <p>No devices added yet. Pick one from the catalog on the left.</p>
        ) : (
          <ul className="list-reset stack-sm">
            {currentProject.components.map((component) => (
              <ProjectComponentRow
                key={component.id}
                component={component}
                isSaving={isSaving}
                onRename={(value) =>
                  void renameComponentInCurrentProject(component.id, value)
                }
                onRemove={() => {
                  const confirmed = window.confirm(
                    `Remove ${component.instanceName} from this project?`
                  );
                  if (confirmed) {
                    void removeComponentFromCurrentProject(component.id);
                  }
                }}
              />
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}

interface ProjectComponentRowProps {
  component: WorkspaceProjectComponent;
  isSaving: boolean;
  onRename: (value: string) => void;
  onRemove: () => void;
}

function ProjectComponentRow({
  component,
  isSaving,
  onRename,
  onRemove
}: ProjectComponentRowProps) {
  const [value, setValue] = useState(component.instanceName);

  useEffect(() => {
    setValue(component.instanceName);
  }, [component.instanceName]);

  function commit() {
    const trimmed = value.trim();
    if (!trimmed || trimmed === component.instanceName) {
      setValue(component.instanceName);
      return;
    }

    onRename(trimmed);
  }

  return (
    <li
      className="component-list-item"
      style={{
        display: "grid",
        gridTemplateColumns: "minmax(0, 1fr) auto auto",
        alignItems: "center",
        gap: "var(--space-sm, 0.75rem)"
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", minWidth: 0 }}>
        <input
          className="field__control"
          disabled={isSaving}
          onBlur={commit}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              event.currentTarget.blur();
            }
          }}
          type="text"
          value={value}
        />
        <span style={{ opacity: 0.7, fontSize: "0.875rem" }}>{component.partName}</span>
      </div>
      <StatusBadge label={component.status} />
      <Button
        disabled={isSaving}
        onClick={onRemove}
        type="button"
        variant="ghost"
      >
        Remove
      </Button>
    </li>
  );
}
