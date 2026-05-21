export const protocols = ["SPI", "I2C", "UART", "USB", "SWD", "GPIO"] as const;
export type Protocol = (typeof protocols)[number];

export const plannerProtocols = ["SPI", "I2C", "UART", "USB", "SWD"] as const;
export type PlannerProtocol = (typeof plannerProtocols)[number];

export const projectStatuses = [
  "Draft",
  "Components Selected",
  "Connections Defined",
  "Pin Mapping Incomplete",
  "Ready to Generate",
  "Generated",
  "Has Conflicts"
] as const;
export type ProjectStatus = (typeof projectStatuses)[number];

export const voltageDomains = ["3.3V", "5V", "Mixed", "Undecided"] as const;
export type VoltageDomain = (typeof voltageDomains)[number];

export const outputTargets = [
  "Generate KiCad starter project",
  "Generate components only",
  "Generate starter sheet structure"
] as const;
export type OutputTarget = (typeof outputTargets)[number];

export const componentStatuses = [
  "Connected",
  "Unconnected",
  "Partially defined"
] as const;
export type ComponentStatus = (typeof componentStatuses)[number];

export const signalAssignmentStatuses = [
  "Valid",
  "Needs confirmation",
  "Conflict"
] as const;
export type SignalAssignmentStatus = (typeof signalAssignmentStatuses)[number];

export const connectionStatuses = ["Valid", "Needs work"] as const;
export type ConnectionStatus = (typeof connectionStatuses)[number];

export const busModes = ["Dedicated", "Shared"] as const;
export type BusMode = (typeof busModes)[number];

export const issueSeverities = ["info", "warning", "error"] as const;
export type IssueSeverity = (typeof issueSeverities)[number];

export interface AppNavigationItem {
  key: string;
  label: string;
  href: string;
}

export interface ProjectSummary {
  id: string;
  name: string;
  controller: string;
  deviceCount: number;
  interfaceCount: number;
  updatedAt: string;
  summary: string;
  status: ProjectStatus;
}

export type ProjectExportResultKind = "file-path" | "download-url";

export interface ProjectExportResult {
  projectId: string;
  projectName: string;
  fileName: string;
  target: string;
  kind: ProjectExportResultKind;
  message: string;
  exportedAt: string;
}

export interface SignalPinOption {
  signal: string;
  pins: string[];
}

export interface ControllerInterfaceDefinition {
  name: string;
  protocol: PlannerProtocol;
  signalPins: SignalPinOption[];
}

export interface ControllerCatalogEntry {
  id: string;
  name: string;
  packageName: string;
  voltage: string;
  notes: string;
  protocols: Protocol[];
  interfaces: ControllerInterfaceDefinition[];
  gpioPins: string[];
}

export interface LibraryCategory {
  id: string;
  label: string;
}

export interface ComponentCatalogEntry {
  id: string;
  name: string;
  categoryId: string;
  categoryLabel: string;
  summary: string;
  voltage: string;
  packageName: string;
  /**
   * 7-bit I2C device address, hex-encoded with `0x` prefix (e.g. `"0x76"`).
   * Optional: only set on components that have a fixed (or default
   * configurable) I2C address. Used by the I2C-address-conflict validator.
   */
  i2cAddress?: string;
  supportedProtocols: Protocol[];
  connectionOptions: ComponentConnectionOption[];
}

export interface ComponentConnectionSignalDefinition {
  name: string;
  source: "interface" | "gpio";
  sharedBehavior: "reuse-on-shared" | "unique";
}

export interface ComponentConnectionOption {
  protocol: PlannerProtocol;
  notes: string;
  optionalSignals: ComponentConnectionSignalDefinition[];
}

export interface ProjectComponentRecord {
  id: string;
  catalogId: string;
  instanceName: string;
  status: ComponentStatus;
  preferredProtocol?: Protocol;
}

export interface SignalAssignment {
  signal: string;
  selectedPin: string;
  alternatePins: string[];
  status: SignalAssignmentStatus;
}

export interface ConnectionRecord {
  id: string;
  componentId: string;
  protocol: Protocol;
  controllerInterface: string;
  pins: string[];
  busMode: BusMode;
  optionalSignals: string[];
  status: ConnectionStatus;
  assignments: SignalAssignment[];
}

export interface ValidationIssue {
  id: string;
  severity: IssueSeverity;
  message: string;
}

export interface ProjectDocument {
  id: string;
  name: string;
  description: string;
  controllerId: string;
  status: ProjectStatus;
  voltageDomain: VoltageDomain;
  template: string;
  outputTarget: OutputTarget;
  components: ProjectComponentRecord[];
  connections: ConnectionRecord[];
  issues: ValidationIssue[];
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceProjectComponent extends ProjectComponentRecord {
  part: ComponentCatalogEntry;
  partName: string;
  supportedProtocols: Protocol[];
}

export interface WorkspaceConnection extends ConnectionRecord {
  name: string;
  peerPart: string;
}

export interface WorkspaceProject extends Omit<
  ProjectDocument,
  "controllerId" | "components" | "connections"
> {
  controller: ControllerCatalogEntry;
  components: WorkspaceProjectComponent[];
  connections: WorkspaceConnection[];
}

export interface CreateProjectInput {
  name: string;
  description: string;
  controllerId: string;
  template: string;
  voltageDomain: VoltageDomain;
  outputTarget: OutputTarget;
}
