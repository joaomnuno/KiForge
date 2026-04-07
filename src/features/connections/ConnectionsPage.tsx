import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AppScaffold } from "../../components/layout/AppScaffold";
import { Button } from "../../components/ui/Button";
import { Panel } from "../../components/ui/Panel";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { useWorkspaceStore } from "../projects/project-store";

export function ConnectionsPage() {
  const currentProject = useWorkspaceStore((state) => state.currentProject);
  const isLoading = useWorkspaceStore((state) => state.isLoading);
  const isSaving = useWorkspaceStore((state) => state.isSaving);
  const errorMessage = useWorkspaceStore((state) => state.errorMessage);
  const saveCurrentProject = useWorkspaceStore((state) => state.saveCurrentProject);
  const [activeConnectionId, setActiveConnectionId] = useState("");

  useEffect(() => {
    setActiveConnectionId(currentProject?.connections[0]?.id ?? "");
  }, [currentProject]);

  const activeConnection = useMemo(
    () =>
      currentProject?.connections.find(
        (connection) => connection.id === activeConnectionId
      ) ?? currentProject?.connections[0],
    [activeConnectionId, currentProject]
  );

  if (!currentProject) {
    return (
      <AppScaffold activeNav="devices" searchPlaceholder="Search devices, interfaces, or pins...">
        <Panel
          title={isLoading ? "Loading workspace" : "No project selected"}
          description={
            isLoading
              ? "Reading your current project definition."
              : "Open a project or create one before reviewing connection plans."
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
      activeNav="devices"
      searchPlaceholder="Search devices, interfaces, or pins..."
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
            eyebrow="Connection inspector"
            title={
              activeConnection
                ? `${activeConnection.name} | ${activeConnection.protocol}`
                : "No connection selected"
            }
            description={
              activeConnection
                ? `Mapped to ${activeConnection.controllerInterface} in ${activeConnection.busMode.toLowerCase()} mode.`
                : "Persisted connections will appear here as the planner becomes interactive."
            }
          >
            {activeConnection ? (
              <table className="signal-table">
                <thead>
                  <tr>
                    <th>Signal</th>
                    <th>Selected pin</th>
                    <th>Alternates</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {activeConnection.assignments.map((assignment) => (
                    <tr key={assignment.signal}>
                      <td>{assignment.signal}</td>
                      <td>{assignment.selectedPin}</td>
                      <td>{assignment.alternatePins.join(", ")}</td>
                      <td>{assignment.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p>No saved connections yet.</p>
            )}
          </Panel>

          <Panel
            eyebrow="Validation"
            title="Open issues"
            description="Conflicts and incomplete optional signals stay visible while the planner is still read-only."
          >
            {currentProject.issues.length === 0 ? (
              <p>No validation issues recorded for this project.</p>
            ) : (
              <ul className="list-reset stack-sm">
                {currentProject.issues.map((issue) => (
                  <li key={issue.id} className={`issue issue--${issue.severity}`}>
                    {issue.message}
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </>
      }
    >
      <div className="connections-layout">
        <Panel eyebrow="Project devices" title="Navigator">
          <div className="device-list">
            {currentProject.components.map((component) => (
              <button key={component.id} className="device-list__item" type="button">
                <div>
                  <strong>{component.instanceName}</strong>
                  <span>{component.partName}</span>
                </div>
                <StatusBadge label={component.status} />
              </button>
            ))}
          </div>
        </Panel>

        <div className="stack-lg">
          <Panel
            eyebrow="Connection planner"
            title="Active connections"
            description="The connection list now comes from the persisted project document, even though editing stays out of scope for this pass."
            headerActions={
              <div className="button-group">
                <Button disabled type="button" variant="secondary">
                  Auto-assign suggestions
                </Button>
                <Button disabled type="button">
                  New connection
                </Button>
              </div>
            }
          >
            {errorMessage ? <p className="form-note">{errorMessage}</p> : null}
            {currentProject.connections.length === 0 ? (
              <p>No logical connections have been saved for this project yet.</p>
            ) : (
              <div className="connection-grid">
                {currentProject.connections.map((connection) => (
                  <button
                    key={connection.id}
                    className={
                      connection.id === activeConnection?.id
                        ? "connection-card connection-card--active"
                        : "connection-card"
                    }
                    onClick={() => setActiveConnectionId(connection.id)}
                    type="button"
                  >
                    <div className="connection-card__header">
                      <div>
                        <h3>{connection.name}</h3>
                        <p>{connection.peerPart}</p>
                      </div>
                      <StatusBadge label={connection.status} />
                    </div>
                    <div className="chip-row">
                      <span className="chip">{connection.protocol}</span>
                      <span className="chip">{connection.controllerInterface}</span>
                      <span className="chip">{connection.busMode} bus</span>
                    </div>
                    <p className="connection-card__pins">
                      Pins: {connection.pins.join(" / ")}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </Panel>

          <Panel
            eyebrow="Builder flow"
            title="Create connection"
            description="This stays as the next implementation target, but it now sits on top of real project storage instead of mock state."
          >
            <ol className="flow-list">
              <li>Choose source and target devices.</li>
              <li>Select the protocol and controller interface instance.</li>
              <li>Assign concrete pins and review conflicts.</li>
              <li>Choose shared bus behavior for SPI or I2C.</li>
              <li>Add optional signals and save the connection.</li>
            </ol>
          </Panel>
        </div>
      </div>
    </AppScaffold>
  );
}
