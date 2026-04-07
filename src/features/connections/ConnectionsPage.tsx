import { useMemo, useState } from "react";
import { AppScaffold } from "../../components/layout/AppScaffold";
import { Button } from "../../components/ui/Button";
import { Panel } from "../../components/ui/Panel";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { currentWorkspace } from "../../data/mockData";

export function ConnectionsPage() {
  const [activeConnectionId, setActiveConnectionId] = useState(
    currentWorkspace.connections[0]?.id ?? ""
  );

  const activeConnection = useMemo(
    () =>
      currentWorkspace.connections.find(
        (connection) => connection.id === activeConnectionId
      ) ?? currentWorkspace.connections[0],
    [activeConnectionId]
  );

  return (
    <AppScaffold
      activeNav="devices"
      searchPlaceholder="Search devices, interfaces, or pins..."
      projectStrip={{
        name: currentWorkspace.name,
        controller: currentWorkspace.controller.name,
        status: currentWorkspace.status,
        voltageDomain: currentWorkspace.voltageDomain
      }}
      inspector={
        <>
          <Panel
            eyebrow="Connection inspector"
            title={`${activeConnection.name} · ${activeConnection.protocol}`}
            description={`Mapped to ${activeConnection.controllerInterface} in ${activeConnection.busMode.toLowerCase()} mode.`}
          >
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
          </Panel>

          <Panel
            eyebrow="Validation"
            title="Open issues"
            description="Conflicts and incomplete optional signals should stay visible while editing."
          >
            <ul className="list-reset stack-sm">
              {currentWorkspace.issues.map((issue) => (
                <li key={issue.id} className={`issue issue--${issue.severity}`}>
                  {issue.message}
                </li>
              ))}
            </ul>
          </Panel>
        </>
      }
    >
      <div className="connections-layout">
        <Panel eyebrow="Project devices" title="Navigator">
          <div className="device-list">
            {currentWorkspace.components.map((component) => (
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
            description="The MVP uses a list-first workspace before adding a graph view."
            headerActions={
              <div className="button-group">
                <Button variant="secondary" type="button">
                  Auto-assign suggestions
                </Button>
                <Button type="button">New connection</Button>
              </div>
            }
          >
            <div className="connection-grid">
              {currentWorkspace.connections.map((connection) => (
                <button
                  key={connection.id}
                  className={
                    connection.id === activeConnection.id
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
          </Panel>

          <Panel
            eyebrow="Builder flow"
            title="Create connection"
            description="The next implementation step is to turn this scaffold into an editable multi-step builder."
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
