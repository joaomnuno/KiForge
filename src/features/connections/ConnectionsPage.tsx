import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AppScaffold } from "../../components/layout/AppScaffold";
import { Button } from "../../components/ui/Button";
import { Panel } from "../../components/ui/Panel";
import { StatusBadge } from "../../components/ui/StatusBadge";
import {
  autoAssignDraft,
  buildConnectionDraft,
  buildConnectionRecordFromDraft,
  getAllowedBusModes,
  getCompatibleProtocolOptions,
  getDraftIssues,
  getDraftSignalRows,
  getInterfaceOptions,
  getAvailableOptionalSignals,
  normalizeConnectionDraft,
  type ConnectionDraft
} from "./planner";
import { useWorkspaceStore } from "../projects/project-store";

export function ConnectionsPage() {
  const currentProject = useWorkspaceStore((state) => state.currentProject);
  const isLoading = useWorkspaceStore((state) => state.isLoading);
  const isSaving = useWorkspaceStore((state) => state.isSaving);
  const errorMessage = useWorkspaceStore((state) => state.errorMessage);
  const saveCurrentProject = useWorkspaceStore((state) => state.saveCurrentProject);
  const saveConnectionToCurrentProject = useWorkspaceStore(
    (state) => state.saveConnectionToCurrentProject
  );
  const deleteConnectionFromCurrentProject = useWorkspaceStore(
    (state) => state.deleteConnectionFromCurrentProject
  );
  const [selectedComponentId, setSelectedComponentId] = useState("");
  const [draft, setDraft] = useState<ConnectionDraft | null>(null);

  const activeComponent = useMemo(
    () =>
      currentProject?.components.find((component) => component.id === selectedComponentId) ??
      currentProject?.components[0] ??
      null,
    [currentProject, selectedComponentId]
  );

  useEffect(() => {
    if (!currentProject || currentProject.components.length === 0) {
      setSelectedComponentId("");
      return;
    }

    if (
      !selectedComponentId ||
      !currentProject.components.some((component) => component.id === selectedComponentId)
    ) {
      setSelectedComponentId(currentProject.components[0].id);
    }
  }, [currentProject, selectedComponentId]);

  useEffect(() => {
    if (!currentProject || !activeComponent) {
      setDraft(null);
      return;
    }

    setDraft(buildConnectionDraft(currentProject, activeComponent.id));
  }, [activeComponent, currentProject]);

  const existingConnection = useMemo(
    () =>
      activeComponent && currentProject
        ? currentProject.connections.find(
            (connection) => connection.componentId === activeComponent.id
          ) ?? null
        : null,
    [activeComponent, currentProject]
  );

  const compatibleProtocols = useMemo(
    () =>
      currentProject && activeComponent
        ? getCompatibleProtocolOptions(currentProject, activeComponent)
        : [],
    [activeComponent, currentProject]
  );

  const interfaceOptions = useMemo(
    () =>
      currentProject && draft?.protocol
        ? getInterfaceOptions(currentProject, draft.protocol, draft.existingConnectionId)
        : [],
    [currentProject, draft]
  );

  const allowedBusModes = useMemo(
    () =>
      getAllowedBusModes(
        interfaceOptions.find((option) => option.name === draft?.controllerInterface)
      ),
    [draft?.controllerInterface, interfaceOptions]
  );

  const availableOptionalSignals = useMemo(
    () =>
      currentProject && draft
        ? getAvailableOptionalSignals(currentProject, draft.componentId, draft.protocol)
        : [],
    [currentProject, draft]
  );

  const signalRows = useMemo(
    () => (currentProject && draft ? getDraftSignalRows(currentProject, draft) : []),
    [currentProject, draft]
  );

  const draftIssues = useMemo(
    () => (currentProject && draft ? getDraftIssues(currentProject, draft) : []),
    [currentProject, draft]
  );

  function updateDraft(mutator: (currentDraft: ConnectionDraft) => ConnectionDraft) {
    if (!currentProject) {
      return;
    }

    setDraft((currentDraft) => {
      if (!currentDraft) {
        return currentDraft;
      }

      return normalizeConnectionDraft(currentProject, mutator(currentDraft));
    });
  }

  function selectComponent(componentId: string) {
    setSelectedComponentId(componentId);
  }

  function handleNewConnection() {
    if (!currentProject) {
      return;
    }

    const nextComponent =
      currentProject.components.find(
        (component) =>
          !currentProject.connections.some(
            (connection) => connection.componentId === component.id
          )
      ) ?? currentProject.components[0];

    if (nextComponent) {
      setSelectedComponentId(nextComponent.id);
    }
  }

  async function handleSaveConnection() {
    if (!currentProject || !draft) {
      return;
    }

    const connection = buildConnectionRecordFromDraft(currentProject, draft);
    if (!connection) {
      return;
    }

    await saveConnectionToCurrentProject(connection);
  }

  async function handleDeleteConnection() {
    if (!existingConnection) {
      return;
    }

    await deleteConnectionFromCurrentProject(existingConnection.id);
  }

  function handleResetDraft() {
    if (!currentProject || !activeComponent) {
      return;
    }

    setDraft(buildConnectionDraft(currentProject, activeComponent.id));
  }

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

  if (currentProject.components.length === 0) {
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
      >
        <Panel
          title="No devices in this project"
          description="Add project components before you start defining controller interfaces and signal assignments."
        >
          <div className="button-group">
            <Link className="button button--primary" to="/workspace/components">
              Go to Components
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
              activeComponent
                ? `${activeComponent.instanceName}${draft?.protocol ? ` | ${draft.protocol}` : ""}`
                : "No device selected"
            }
            description={
              draft?.controllerInterface
                ? `Using ${draft.controllerInterface} in ${draft.busMode.toLowerCase()} mode.`
                : "Choose a protocol and controller interface to start assigning pins."
            }
          >
            {signalRows.length === 0 ? (
              <p>No signal rows yet.</p>
            ) : (
              <table className="signal-table">
                <thead>
                  <tr>
                    <th>Signal</th>
                    <th>Pin</th>
                    <th>Options</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {signalRows.map((row) => (
                    <tr key={row.signal}>
                      <td>{row.signal}</td>
                      <td>{row.selectedPin || "Unassigned"}</td>
                      <td>{row.candidates.length}</td>
                      <td>{row.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Panel>

          <Panel
            eyebrow="Interface availability"
            title={draft?.protocol ? `${draft.protocol} controller paths` : "Choose a protocol"}
            description="Unused interfaces can be dedicated. Shared-capable buses must be marked explicitly before anything else joins them."
          >
            {interfaceOptions.length === 0 ? (
              <p>No controller interfaces are available for this protocol yet.</p>
            ) : (
              <ul className="list-reset stack-sm">
                {interfaceOptions.map((option) => (
                  <li key={option.name} className="availability-item">
                    <div>
                      <strong>{option.name}</strong>
                      <span>{option.description}</span>
                    </div>
                    <StatusBadge label={option.usageLabel} />
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel
            eyebrow="Validation"
            title="Draft issues"
            description="The builder stays explicit about unresolved signals, unavailable interfaces, and pin conflicts."
          >
            {draftIssues.length === 0 ? (
              <p>No draft issues right now.</p>
            ) : (
              <ul className="list-reset stack-sm">
                {draftIssues.map((issue) => (
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
              <button
                key={component.id}
                className={
                  component.id === activeComponent?.id
                    ? "device-list__item category-item--active"
                    : "device-list__item"
                }
                onClick={() => selectComponent(component.id)}
                type="button"
              >
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
            description="Each saved connection now comes from the real project document and can be reopened through the device list."
            headerActions={
              <div className="button-group">
                <Button
                  disabled={!draft || isSaving}
                  onClick={() =>
                    currentProject && draft
                      ? setDraft(autoAssignDraft(currentProject, draft))
                      : undefined
                  }
                  type="button"
                  variant="secondary"
                >
                  Auto-assign suggestions
                </Button>
                <Button disabled={isSaving} onClick={handleNewConnection} type="button">
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
                      connection.componentId === activeComponent?.id
                        ? "connection-card connection-card--active"
                        : "connection-card"
                    }
                    onClick={() => selectComponent(connection.componentId)}
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
                      Pins: {connection.pins.join(" / ") || "Unassigned"}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </Panel>

          <Panel
            eyebrow="Builder"
            title={
              activeComponent
                ? `Plan ${activeComponent.instanceName}`
                : "Select a device"
            }
            description={
              activeComponent
                ? `Choose the protocol, controller interface, bus mode, and explicit signal mapping for ${activeComponent.partName}.`
                : "Select a project device from the navigator."
            }
          >
            {!activeComponent ? (
              <p>No component is selected for planning.</p>
            ) : compatibleProtocols.length === 0 ? (
              <p>
                {activeComponent.instanceName} has no compatible controller interface on{" "}
                {currentProject.controller.name}.
              </p>
            ) : !draft ? (
              <p>The planner could not initialize this connection draft.</p>
            ) : (
              <>
                <div className="planner-section">
                  <p className="eyebrow">Compatible protocols</p>
                  <div className="button-group">
                    {compatibleProtocols.map((option) => (
                      <button
                        key={option.protocol}
                        className={
                          draft.protocol === option.protocol
                            ? "filter-pill filter-pill--active"
                            : "filter-pill"
                        }
                        onClick={() =>
                          updateDraft((currentDraft) => ({
                            ...currentDraft,
                            protocol: option.protocol
                          }))
                        }
                        type="button"
                      >
                        {option.protocol}
                      </button>
                    ))}
                  </div>
                  <p className="planner-note">
                    {compatibleProtocols.find((option) => option.protocol === draft.protocol)?.notes}
                  </p>
                </div>

                <div className="planner-form-grid">
                  <label className="field">
                    <span>Controller interface</span>
                    <select
                      className="field__control"
                      onChange={(event) =>
                        updateDraft((currentDraft) => ({
                          ...currentDraft,
                          controllerInterface: event.target.value
                        }))
                      }
                      value={draft.controllerInterface}
                    >
                      {interfaceOptions.map((option) => (
                        <option
                          disabled={option.disabled}
                          key={option.name}
                          value={option.name}
                        >
                          {option.name} | {option.usageLabel}
                        </option>
                      ))}
                    </select>
                  </label>

                  <div className="field">
                    <span>Bus usage</span>
                    <div className="button-group">
                      {allowedBusModes.map((busMode) => (
                        <button
                          key={busMode}
                          className={
                            draft.busMode === busMode
                              ? "filter-pill filter-pill--active"
                              : "filter-pill"
                          }
                          onClick={() =>
                            updateDraft((currentDraft) => ({
                              ...currentDraft,
                              busMode
                            }))
                          }
                          type="button"
                        >
                          {busMode}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="planner-section">
                  <div className="planner-section__header">
                    <div>
                      <p className="eyebrow">Signal assignments</p>
                      <p className="planner-note">
                        Auto-assignment is explicit. Every selected pin remains editable.
                      </p>
                    </div>
                  </div>

                  <div className="planner-row-list">
                    {signalRows.map((row) => (
                      <div key={row.signal} className="planner-row">
                        <div className="planner-row__meta">
                          <strong>{row.signal}</strong>
                          <span>{row.optional ? "Optional signal" : "Required signal"}</span>
                        </div>

                        <select
                          className="field__control"
                          onChange={(event) =>
                            updateDraft((currentDraft) => ({
                              ...currentDraft,
                              assignments: {
                                ...currentDraft.assignments,
                                [row.signal]: event.target.value
                              }
                            }))
                          }
                          value={row.selectedPin}
                        >
                          <option value="">Unassigned</option>
                          {row.candidates.map((candidate) => (
                            <option key={`${row.signal}-${candidate.pin}`} value={candidate.pin}>
                              {candidate.pin} | {candidate.note}
                            </option>
                          ))}
                        </select>

                        <StatusBadge label={row.status} />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="planner-section">
                  <p className="eyebrow">Optional signals</p>
                  {availableOptionalSignals.length === 0 ? (
                    <p className="planner-note">This protocol has no optional signals in the MVP catalog.</p>
                  ) : (
                    <div className="button-group">
                      {availableOptionalSignals.map((signal) => {
                        const enabled = draft.enabledOptionalSignals.includes(signal.name);

                        return (
                          <button
                            key={signal.name}
                            className={enabled ? "filter-pill filter-pill--active" : "filter-pill"}
                            onClick={() =>
                              updateDraft((currentDraft) => ({
                                ...currentDraft,
                                enabledOptionalSignals: enabled
                                  ? currentDraft.enabledOptionalSignals.filter(
                                      (currentSignal) => currentSignal !== signal.name
                                    )
                                  : [...currentDraft.enabledOptionalSignals, signal.name]
                              }))
                            }
                            type="button"
                          >
                            {enabled ? `Remove ${signal.name}` : `Add ${signal.name}`}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="planner-summary">
                  <div>
                    <dt>Device</dt>
                    <dd>{activeComponent.partName}</dd>
                  </div>
                  <div>
                    <dt>Protocol</dt>
                    <dd>{draft.protocol}</dd>
                  </div>
                  <div>
                    <dt>Interface</dt>
                    <dd>{draft.controllerInterface || "Unassigned"}</dd>
                  </div>
                  <div>
                    <dt>Bus mode</dt>
                    <dd>{draft.busMode}</dd>
                  </div>
                </div>

                <div className="form-actions">
                  <div className="button-group">
                    <Button
                      disabled={isSaving}
                      onClick={handleResetDraft}
                      type="button"
                      variant="ghost"
                    >
                      Reset
                    </Button>
                    {existingConnection ? (
                      <Button
                        disabled={isSaving}
                        onClick={() => void handleDeleteConnection()}
                        type="button"
                        variant="ghost"
                      >
                        Remove
                      </Button>
                    ) : null}
                  </div>

                  <Button
                    disabled={isSaving || !draft.protocol || !draft.controllerInterface}
                    onClick={() => void handleSaveConnection()}
                    type="button"
                  >
                    {existingConnection ? "Save changes" : "Save connection"}
                  </Button>
                </div>
              </>
            )}
          </Panel>
        </div>
      </div>
    </AppScaffold>
  );
}
