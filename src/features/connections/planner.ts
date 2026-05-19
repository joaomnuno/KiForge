import {
  findComponentConnectionOption,
  findControllerInterface
} from "../catalog/catalog";
import { resolveProjectDocument } from "../projects/project-mappers";
import type {
  BusMode,
  ComponentConnectionSignalDefinition,
  ConnectionRecord,
  PlannerProtocol,
  ProjectDocument,
  ProjectStatus,
  SignalAssignment,
  SignalAssignmentStatus,
  ValidationIssue,
  WorkspaceProject,
  WorkspaceProjectComponent
} from "../../types/domain";

interface ProtocolSpec {
  protocol: PlannerProtocol;
  supportsSharedBus: boolean;
  requiredSignals: ComponentConnectionSignalDefinition[];
}

export interface ConnectionDraft {
  componentId: string;
  existingConnectionId?: string;
  protocol?: PlannerProtocol;
  controllerInterface: string;
  busMode: BusMode;
  enabledOptionalSignals: string[];
  assignments: Record<string, string>;
}

export interface InterfaceOption {
  name: string;
  protocol: PlannerProtocol;
  description: string;
  usageLabel: string;
  disabled: boolean;
  allowsDedicated: boolean;
  allowsShared: boolean;
}

export interface PinCandidate {
  pin: string;
  state: "available" | "shared" | "conflict";
  note: string;
}

export interface DraftSignalRow {
  signal: string;
  selectedPin: string;
  optional: boolean;
  status: SignalAssignmentStatus;
  candidates: PinCandidate[];
}

export interface ProjectValidationSummary {
  totalDevices: number;
  connectedDevices: number;
  savedConnections: number;
  unresolvedIssues: number;
  errorConflicts: number;
  warningCount: number;
  optionalSignalCount: number;
  optionalUnresolved: number;
}

interface ProjectValidationSummarySource {
  components: Array<Pick<ProjectDocument["components"][number], "status">>;
  connections: Array<
    Pick<ProjectDocument["connections"][number], "optionalSignals">
  >;
  issues: ValidationIssue[];
}

interface PinUsage {
  pin: string;
  signal: string;
  connectionId: string;
  componentName: string;
  controllerInterface: string;
  protocol: ConnectionRecord["protocol"];
}

const protocolSpecs: Record<PlannerProtocol, ProtocolSpec> = {
  SPI: {
    protocol: "SPI",
    supportsSharedBus: true,
    requiredSignals: [
      { name: "SCK", source: "interface", sharedBehavior: "reuse-on-shared" },
      { name: "MISO", source: "interface", sharedBehavior: "reuse-on-shared" },
      { name: "MOSI", source: "interface", sharedBehavior: "reuse-on-shared" },
      { name: "CS", source: "gpio", sharedBehavior: "unique" }
    ]
  },
  I2C: {
    protocol: "I2C",
    supportsSharedBus: true,
    requiredSignals: [
      { name: "SCL", source: "interface", sharedBehavior: "reuse-on-shared" },
      { name: "SDA", source: "interface", sharedBehavior: "reuse-on-shared" }
    ]
  },
  UART: {
    protocol: "UART",
    supportsSharedBus: false,
    requiredSignals: [
      { name: "TX", source: "interface", sharedBehavior: "unique" },
      { name: "RX", source: "interface", sharedBehavior: "unique" }
    ]
  },
  USB: {
    protocol: "USB",
    supportsSharedBus: false,
    requiredSignals: [
      { name: "D+", source: "interface", sharedBehavior: "unique" },
      { name: "D-", source: "interface", sharedBehavior: "unique" }
    ]
  },
  SWD: {
    protocol: "SWD",
    supportsSharedBus: false,
    requiredSignals: [
      { name: "SWDIO", source: "interface", sharedBehavior: "unique" },
      { name: "SWCLK", source: "interface", sharedBehavior: "unique" }
    ]
  }
};

function getProtocolSpec(protocol: PlannerProtocol) {
  return protocolSpecs[protocol];
}

function asPlannerProtocol(
  protocol:
    | ConnectionRecord["protocol"]
    | WorkspaceProjectComponent["preferredProtocol"]
): PlannerProtocol | undefined {
  return protocol && protocol in protocolSpecs
    ? (protocol as PlannerProtocol)
    : undefined;
}

function getComponent(project: WorkspaceProject, componentId: string) {
  return project.components.find((component) => component.id === componentId);
}

function getConnectionForComponent(
  project: WorkspaceProject,
  componentId: string
) {
  return project.connections.find(
    (connection) => connection.componentId === componentId
  );
}

function getAssignmentsMap(assignments: SignalAssignment[]) {
  return Object.fromEntries(
    assignments.map((assignment) => [assignment.signal, assignment.selectedPin])
  );
}

export function getCompatibleProtocolOptions(
  project: WorkspaceProject,
  component: WorkspaceProjectComponent
) {
  return component.part.connectionOptions.filter((option) =>
    project.controller.interfaces.some(
      (controllerInterface) => controllerInterface.protocol === option.protocol
    )
  );
}

function getOtherConnectionsOnInterface(
  project: WorkspaceProject,
  interfaceName: string,
  existingConnectionId?: string
) {
  return project.connections.filter(
    (connection) =>
      connection.controllerInterface === interfaceName &&
      connection.id !== existingConnectionId
  );
}

export function getInterfaceOptions(
  project: WorkspaceProject,
  protocol: PlannerProtocol,
  existingConnectionId?: string
) {
  const spec = getProtocolSpec(protocol);

  return project.controller.interfaces
    .filter((controllerInterface) => controllerInterface.protocol === protocol)
    .map<InterfaceOption>((controllerInterface) => {
      const otherConnections = getOtherConnectionsOnInterface(
        project,
        controllerInterface.name,
        existingConnectionId
      );

      if (otherConnections.length === 0) {
        return {
          name: controllerInterface.name,
          protocol,
          description:
            "Unused interface ready for a dedicated connection or an explicitly shared bus.",
          usageLabel: "Unused",
          disabled: false,
          allowsDedicated: true,
          allowsShared: spec.supportsSharedBus
        };
      }

      const otherNames = otherConnections
        .map((connection) => connection.name)
        .join(", ");
      const allShared =
        spec.supportsSharedBus &&
        otherConnections.every(
          (connection) =>
            connection.protocol === protocol && connection.busMode === "Shared"
        );

      if (allShared) {
        return {
          name: controllerInterface.name,
          protocol,
          description: `Shared bus already used by ${otherNames}.`,
          usageLabel: "Shared bus",
          disabled: false,
          allowsDedicated: false,
          allowsShared: true
        };
      }

      return {
        name: controllerInterface.name,
        protocol,
        description: `Reserved by ${otherNames}. Change the existing connection explicitly before reusing it.`,
        usageLabel: "In use",
        disabled: true,
        allowsDedicated: false,
        allowsShared: false
      };
    });
}

export function getAvailableOptionalSignals(
  project: WorkspaceProject,
  componentId: string,
  protocol?: PlannerProtocol
) {
  if (!protocol) {
    return [];
  }

  const component = getComponent(project, componentId);
  if (!component) {
    return [];
  }

  return (
    findComponentConnectionOption(component.part, protocol)?.optionalSignals ??
    []
  );
}

function getSignalDefinitions(
  project: WorkspaceProject,
  draft: ConnectionDraft
) {
  if (!draft.protocol) {
    return [];
  }

  const component = getComponent(project, draft.componentId);
  if (!component) {
    return [];
  }

  const requiredSignals = getProtocolSpec(draft.protocol).requiredSignals;
  const optionalSignals = getAvailableOptionalSignals(
    project,
    draft.componentId,
    draft.protocol
  ).filter((signal) => draft.enabledOptionalSignals.includes(signal.name));

  return [
    ...requiredSignals.map((signal) => ({ ...signal, optional: false })),
    ...optionalSignals.map((signal) => ({ ...signal, optional: true }))
  ];
}

export function buildConnectionDraft(
  project: WorkspaceProject,
  componentId: string
): ConnectionDraft | null {
  const component = getComponent(project, componentId);
  if (!component) {
    return null;
  }

  const existingConnection = getConnectionForComponent(project, componentId);
  const compatibleProtocols = getCompatibleProtocolOptions(project, component);
  const preferredProtocol =
    asPlannerProtocol(existingConnection?.protocol) ??
    asPlannerProtocol(component.preferredProtocol) ??
    compatibleProtocols[0]?.protocol;

  if (!preferredProtocol) {
    return null;
  }

  const interfaceOptions = getInterfaceOptions(
    project,
    preferredProtocol,
    existingConnection?.id
  );
  const chosenInterface =
    interfaceOptions.find(
      (option) =>
        option.name === existingConnection?.controllerInterface &&
        !option.disabled
    )?.name ??
    interfaceOptions.find((option) => !option.disabled)?.name ??
    interfaceOptions[0]?.name ??
    "";

  const matchingInterface = interfaceOptions.find(
    (option) => option.name === chosenInterface
  );
  const allowedBusModes = getAllowedBusModes(matchingInterface);
  const chosenBusMode =
    existingConnection && allowedBusModes.includes(existingConnection.busMode)
      ? existingConnection.busMode
      : (allowedBusModes[0] ?? "Dedicated");

  const optionalSignals = getAvailableOptionalSignals(
    project,
    componentId,
    preferredProtocol
  );
  const enabledOptionalSignals = optionalSignals
    .filter((signal) =>
      existingConnection?.assignments.some(
        (assignment) => assignment.signal === signal.name
      )
    )
    .map((signal) => signal.name);

  return normalizeConnectionDraft(project, {
    componentId,
    existingConnectionId: existingConnection?.id,
    protocol: preferredProtocol,
    controllerInterface: chosenInterface,
    busMode: chosenBusMode,
    enabledOptionalSignals,
    assignments: existingConnection
      ? getAssignmentsMap(existingConnection.assignments)
      : {}
  });
}

export function normalizeConnectionDraft(
  project: WorkspaceProject,
  draft: ConnectionDraft
): ConnectionDraft {
  const component = getComponent(project, draft.componentId);
  if (!component) {
    return draft;
  }

  const compatibleProtocols = getCompatibleProtocolOptions(project, component);
  const normalizedProtocol =
    compatibleProtocols.find((option) => option.protocol === draft.protocol)
      ?.protocol ?? compatibleProtocols[0]?.protocol;

  if (!normalizedProtocol) {
    return {
      ...draft,
      protocol: undefined,
      controllerInterface: "",
      enabledOptionalSignals: [],
      assignments: {}
    };
  }

  const interfaceOptions = getInterfaceOptions(
    project,
    normalizedProtocol,
    draft.existingConnectionId
  );
  const normalizedInterface =
    interfaceOptions.find(
      (option) => option.name === draft.controllerInterface && !option.disabled
    )?.name ??
    interfaceOptions.find((option) => !option.disabled)?.name ??
    interfaceOptions[0]?.name ??
    "";

  const allowedBusModes = getAllowedBusModes(
    interfaceOptions.find((option) => option.name === normalizedInterface)
  );
  const normalizedBusMode =
    allowedBusModes.find((busMode) => busMode === draft.busMode) ??
    allowedBusModes[0] ??
    "Dedicated";

  const availableOptionalSignals = getAvailableOptionalSignals(
    project,
    draft.componentId,
    normalizedProtocol
  );
  const normalizedOptionalSignals = draft.enabledOptionalSignals.filter(
    (signalName) =>
      availableOptionalSignals.some((signal) => signal.name === signalName)
  );
  const knownSignals = new Set(
    [
      ...getProtocolSpec(normalizedProtocol).requiredSignals.map(
        (signal) => signal.name
      ),
      ...normalizedOptionalSignals
    ].values()
  );
  const normalizedAssignments = Object.fromEntries(
    Object.entries(draft.assignments).filter(([signal]) =>
      knownSignals.has(signal)
    )
  );

  return {
    ...draft,
    protocol: normalizedProtocol,
    controllerInterface: normalizedInterface,
    busMode: normalizedBusMode,
    enabledOptionalSignals: normalizedOptionalSignals,
    assignments: normalizedAssignments
  };
}

export function getAllowedBusModes(interfaceOption?: InterfaceOption) {
  if (!interfaceOption) {
    return [] as BusMode[];
  }

  const busModes: BusMode[] = [];
  if (interfaceOption.allowsDedicated) {
    busModes.push("Dedicated");
  }
  if (interfaceOption.allowsShared) {
    busModes.push("Shared");
  }

  return busModes;
}

function getPinUsages(
  project: WorkspaceProject,
  existingConnectionId?: string
) {
  return project.connections.flatMap<PinUsage>((connection) => {
    if (connection.id === existingConnectionId) {
      return [];
    }

    return connection.assignments
      .filter((assignment) => assignment.selectedPin)
      .map((assignment) => ({
        pin: assignment.selectedPin,
        signal: assignment.signal,
        connectionId: connection.id,
        componentName: connection.name,
        controllerInterface: connection.controllerInterface,
        protocol: connection.protocol
      }));
  });
}

function getDraftPinUsages(draft: ConnectionDraft, signalName: string) {
  return Object.entries(draft.assignments)
    .filter(([currentSignal, pin]) => currentSignal !== signalName && pin)
    .map<PinUsage>(([currentSignal, pin]) => ({
      pin,
      signal: currentSignal,
      connectionId: draft.existingConnectionId ?? `${draft.componentId}-draft`,
      componentName: "Current draft",
      controllerInterface: draft.controllerInterface,
      protocol: draft.protocol ?? "GPIO"
    }));
}

function getBaseCandidatePins(
  project: WorkspaceProject,
  draft: ConnectionDraft,
  signal: ComponentConnectionSignalDefinition
) {
  if (!draft.protocol) {
    return [];
  }

  if (signal.source === "gpio") {
    return project.controller.gpioPins;
  }

  const controllerInterface = findControllerInterface(
    project.controller,
    draft.controllerInterface
  );
  if (!controllerInterface) {
    return [];
  }

  return (
    controllerInterface.signalPins.find(
      (signalPins) => signalPins.signal === signal.name
    )?.pins ?? []
  );
}

function getExistingSharedBusUsages(
  project: WorkspaceProject,
  draft: ConnectionDraft,
  signal: ComponentConnectionSignalDefinition
) {
  if (
    draft.busMode !== "Shared" ||
    signal.sharedBehavior !== "reuse-on-shared" ||
    !draft.controllerInterface
  ) {
    return [];
  }

  return getPinUsages(project, draft.existingConnectionId).filter(
    (usage) =>
      usage.controllerInterface === draft.controllerInterface &&
      usage.protocol === draft.protocol &&
      usage.signal === signal.name
  );
}

export function getPinCandidates(
  project: WorkspaceProject,
  draft: ConnectionDraft,
  signal: ComponentConnectionSignalDefinition
) {
  const usages = [
    ...getPinUsages(project, draft.existingConnectionId),
    ...getDraftPinUsages(draft, signal.name)
  ];
  const basePins = getBaseCandidatePins(project, draft, signal);
  const existingSharedPins = getExistingSharedBusUsages(project, draft, signal);
  const currentPin = draft.assignments[signal.name];
  const candidatePins = [...basePins];
  const reusedPins = new Set(existingSharedPins.map((usage) => usage.pin));

  if (currentPin && !candidatePins.includes(currentPin)) {
    candidatePins.unshift(currentPin);
  }

  return candidatePins.map<PinCandidate>((pin) => {
    const pinUsages = usages.filter((usage) => usage.pin === pin);
    if (pinUsages.length === 0) {
      if (reusedPins.size > 0 && !reusedPins.has(pin)) {
        return {
          pin,
          state: "conflict",
          note: `Shared bus already uses ${Array.from(reusedPins).join(", ")}`
        };
      }

      return {
        pin,
        state: "available",
        note: "Available"
      };
    }

    const sharedUsage = existingSharedPins.find((usage) => usage.pin === pin);
    if (sharedUsage) {
      return {
        pin,
        state: "shared",
        note: `Reused with ${sharedUsage.componentName}`
      };
    }

    return {
      pin,
      state: "conflict",
      note: `Used by ${pinUsages.map((usage) => usage.componentName).join(", ")}`
    };
  });
}

function getSignalStatus(
  candidates: PinCandidate[],
  selectedPin: string
): SignalAssignmentStatus {
  if (!selectedPin) {
    return "Needs confirmation";
  }

  const candidate = candidates.find((item) => item.pin === selectedPin);
  if (!candidate || candidate.state === "conflict") {
    return "Conflict";
  }

  return "Valid";
}

export function getDraftSignalRows(
  project: WorkspaceProject,
  draft: ConnectionDraft
) {
  return getSignalDefinitions(project, draft).map<DraftSignalRow>((signal) => {
    const candidates = getPinCandidates(project, draft, signal);
    const selectedPin = draft.assignments[signal.name] ?? "";

    return {
      signal: signal.name,
      selectedPin,
      optional: signal.optional,
      status: getSignalStatus(candidates, selectedPin),
      candidates
    };
  });
}

export function autoAssignDraft(
  project: WorkspaceProject,
  draft: ConnectionDraft
): ConnectionDraft {
  const nextDraft: ConnectionDraft = {
    ...draft,
    assignments: { ...draft.assignments }
  };

  for (const signal of getSignalDefinitions(project, nextDraft)) {
    const candidates = getPinCandidates(project, nextDraft, signal);
    const currentPin = nextDraft.assignments[signal.name];
    const currentCandidate = candidates.find(
      (candidate) => candidate.pin === currentPin
    );

    if (currentCandidate && currentCandidate.state !== "conflict") {
      continue;
    }

    const recommendedCandidate =
      candidates.find((candidate) => candidate.state === "shared") ??
      candidates.find((candidate) => candidate.state === "available");

    nextDraft.assignments[signal.name] = recommendedCandidate?.pin ?? "";
  }

  return nextDraft;
}

function buildConnectionId(componentId: string) {
  return `conn-${componentId}`;
}

export function buildConnectionRecordFromDraft(
  project: WorkspaceProject,
  draft: ConnectionDraft
) {
  if (!draft.protocol || !draft.controllerInterface) {
    return null;
  }

  const rows = getDraftSignalRows(project, draft);
  const assignments: SignalAssignment[] = rows.map((row) => ({
    signal: row.signal,
    selectedPin: row.selectedPin,
    alternatePins: row.candidates
      .filter((candidate) => candidate.pin !== row.selectedPin)
      .map((candidate) => candidate.pin),
    status: row.status
  }));
  const optionalSignals = rows
    .filter((row) => row.optional)
    .map((row) =>
      row.selectedPin
        ? `${row.signal} -> ${row.selectedPin}`
        : `${row.signal} not assigned`
    );

  return {
    id: draft.existingConnectionId ?? buildConnectionId(draft.componentId),
    componentId: draft.componentId,
    protocol: draft.protocol,
    controllerInterface: draft.controllerInterface,
    pins: assignments
      .filter((assignment) => assignment.selectedPin)
      .map((assignment) => assignment.selectedPin),
    busMode: draft.busMode,
    optionalSignals,
    status: assignments.every((assignment) => assignment.status === "Valid")
      ? "Valid"
      : "Needs work",
    assignments
  } satisfies ConnectionRecord;
}

function buildDraftFromConnection(
  project: WorkspaceProject,
  connection: ConnectionRecord
): ConnectionDraft | null {
  const protocol = asPlannerProtocol(connection.protocol);
  if (!protocol) {
    return null;
  }

  const component = getComponent(project, connection.componentId);
  if (!component) {
    return null;
  }

  const optionalSignals = getAvailableOptionalSignals(
    project,
    component.id,
    protocol
  );
  const enabledOptionalSignals = optionalSignals
    .filter((signal) =>
      connection.assignments.some(
        (assignment) => assignment.signal === signal.name
      )
    )
    .map((signal) => signal.name);

  return normalizeConnectionDraft(project, {
    componentId: connection.componentId,
    existingConnectionId: connection.id,
    protocol,
    controllerInterface: connection.controllerInterface,
    busMode: connection.busMode,
    enabledOptionalSignals,
    assignments: getAssignmentsMap(connection.assignments)
  });
}

function buildConnectionIssues(
  project: WorkspaceProject,
  component: WorkspaceProjectComponent,
  connection: ConnectionRecord,
  rows: DraftSignalRow[]
) {
  const issues: ValidationIssue[] = [];

  const interfaceOptions = getInterfaceOptions(
    project,
    connection.protocol as PlannerProtocol,
    connection.id
  );
  const selectedInterface = interfaceOptions.find(
    (option) => option.name === connection.controllerInterface
  );
  const allowedBusModes = getAllowedBusModes(selectedInterface);
  if (!allowedBusModes.includes(connection.busMode)) {
    issues.push({
      id: `${connection.id}-bus-mode`,
      severity: "error",
      message: `${component.instanceName} cannot use ${connection.controllerInterface} in ${connection.busMode.toLowerCase()} mode.`
    });
  }

  for (const row of rows) {
    if (!row.selectedPin) {
      issues.push({
        id: `${connection.id}-${row.signal}-missing`,
        severity: row.optional ? "warning" : "error",
        message: `${component.instanceName} still needs ${row.signal} assigned.`
      });
      continue;
    }

    if (row.status === "Conflict") {
      issues.push({
        id: `${connection.id}-${row.signal}-conflict`,
        severity: "error",
        message: `${component.instanceName} conflicts on ${row.signal} -> ${row.selectedPin}.`
      });
    }
  }

  return issues;
}

export function getDraftIssues(
  project: WorkspaceProject,
  draft: ConnectionDraft
) {
  const component = getComponent(project, draft.componentId);
  if (!component) {
    return [] as ValidationIssue[];
  }

  if (!draft.protocol) {
    return [
      {
        id: `${draft.componentId}-protocol-missing`,
        severity: "warning" as const,
        message: `${component.instanceName} still needs a protocol choice.`
      }
    ];
  }

  if (!draft.controllerInterface) {
    return [
      {
        id: `${draft.componentId}-interface-missing`,
        severity: "warning" as const,
        message: `${component.instanceName} still needs a controller interface.`
      }
    ];
  }

  const connection = buildConnectionRecordFromDraft(project, draft);
  if (!connection) {
    return [] as ValidationIssue[];
  }

  const rows = getDraftSignalRows(project, draft);
  return buildConnectionIssues(project, component, connection, rows);
}

export function getProjectValidationSummary(
  project: ProjectValidationSummarySource
): ProjectValidationSummary {
  const errorConflicts = project.issues.filter(
    (issue) => issue.severity === "error" && issue.id.endsWith("-conflict")
  ).length;
  const warningIssues = project.issues.filter(
    (issue) => issue.severity === "warning"
  );

  return {
    totalDevices: project.components.length,
    connectedDevices: project.components.filter(
      (component) => component.status === "Connected"
    ).length,
    savedConnections: project.connections.length,
    unresolvedIssues: project.issues.length,
    errorConflicts,
    warningCount: warningIssues.length,
    optionalSignalCount: project.connections.reduce(
      (count, connection) => count + connection.optionalSignals.length,
      0
    ),
    optionalUnresolved: warningIssues.filter((issue) =>
      issue.id.endsWith("-missing")
    ).length
  };
}

function deriveProjectStatus(
  project: ProjectDocument,
  issues: ValidationIssue[]
): ProjectStatus {
  if (project.components.length === 0) {
    return "Draft";
  }

  if (project.connections.length === 0) {
    return "Components Selected";
  }

  if (issues.some((issue) => issue.severity === "error")) {
    return "Has Conflicts";
  }

  if (
    issues.some((issue) => issue.severity === "warning") ||
    project.components.some((component) => component.status !== "Connected")
  ) {
    return "Pin Mapping Incomplete";
  }

  return "Connections Defined";
}

export function applyDerivedProjectState(project: ProjectDocument) {
  const workspace = resolveProjectDocument(project);
  const issues: ValidationIssue[] = [];

  const derivedConnections = project.connections.map((connection) => {
    const component = getComponent(workspace, connection.componentId);
    const draft = buildDraftFromConnection(workspace, connection);

    if (!component || !draft) {
      issues.push({
        id: `${connection.id}-invalid`,
        severity: "error",
        message: `A saved connection could not be resolved for ${connection.componentId}.`
      });

      return {
        ...connection,
        status: "Needs work" as const
      };
    }

    const rebuiltConnection = buildConnectionRecordFromDraft(workspace, draft);
    if (!rebuiltConnection) {
      issues.push({
        id: `${connection.id}-incomplete`,
        severity: "error",
        message: `${component.instanceName} still needs a protocol and controller interface.`
      });

      return {
        ...connection,
        status: "Needs work" as const
      };
    }

    const rows = getDraftSignalRows(workspace, draft);
    issues.push(
      ...buildConnectionIssues(workspace, component, rebuiltConnection, rows)
    );
    return rebuiltConnection;
  });

  const derivedComponents = project.components.map((component) => {
    const matchingConnection = derivedConnections.find(
      (connection) => connection.componentId === component.id
    );

    if (!matchingConnection) {
      issues.push({
        id: `${component.id}-unconnected`,
        severity: "info",
        message: `${component.instanceName} is still unconnected.`
      });

      return {
        ...component,
        status: "Unconnected" as const
      };
    }

    return {
      ...component,
      status:
        matchingConnection.status === "Valid"
          ? ("Connected" as const)
          : ("Partially defined" as const)
    };
  });

  const nextProject: ProjectDocument = {
    ...project,
    components: derivedComponents,
    connections: derivedConnections,
    issues,
    status: deriveProjectStatus(
      {
        ...project,
        components: derivedComponents,
        connections: derivedConnections
      },
      issues
    )
  };

  return nextProject;
}
