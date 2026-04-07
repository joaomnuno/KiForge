export type Protocol = "SPI" | "I2C" | "UART" | "USB" | "SWD" | "GPIO";

export type ProjectStatus =
  | "Draft"
  | "Components Selected"
  | "Connections Defined"
  | "Pin Mapping Incomplete"
  | "Ready to Generate"
  | "Generated"
  | "Has Conflicts";

export interface ProjectSummary {
  id: string;
  name: string;
  controller: string;
  deviceCount: number;
  interfaceCount: number;
  lastEdited: string;
  summary: string;
  status: ProjectStatus;
}

export interface ControllerOption {
  id: string;
  name: string;
  packageName: string;
  voltage: string;
  notes: string;
  protocols: Protocol[];
  interfaces: string[];
}

export interface LibraryCategory {
  id: string;
  label: string;
}

export interface LibraryEntry {
  id: string;
  name: string;
  categoryId: string;
  summary: string;
  voltage: string;
  packageName: string;
  supportedProtocols: Protocol[];
}

export interface ProjectComponent {
  id: string;
  instanceName: string;
  partName: string;
  status: "Connected" | "Unconnected" | "Partially defined";
  preferredProtocol?: Protocol;
}

export interface SignalAssignment {
  signal: string;
  selectedPin: string;
  alternatePins: string[];
  status: "Valid" | "Needs confirmation" | "Conflict";
}

export interface ConnectionSummary {
  id: string;
  name: string;
  peerPart: string;
  protocol: Protocol;
  controllerInterface: string;
  pins: string[];
  busMode: "Dedicated" | "Shared";
  optionalSignals: string[];
  status: "Valid" | "Needs work";
  assignments: SignalAssignment[];
}

export interface ValidationIssue {
  id: string;
  severity: "info" | "warning" | "error";
  message: string;
}

export interface WorkspaceProject {
  id: string;
  name: string;
  controller: ControllerOption;
  status: ProjectStatus;
  voltageDomain: string;
  components: ProjectComponent[];
  connections: ConnectionSummary[];
  issues: ValidationIssue[];
}
