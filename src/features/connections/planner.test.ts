import { resolveProjectDocument } from "../projects/project-mappers";
import {
  applyDerivedProjectState,
  autoAssignDraft,
  buildConnectionDraft,
  buildConnectionRecordFromDraft,
  getInterfaceOptions,
  getProjectValidationSummary
} from "./planner";
import type { ProjectDocument } from "../../types/domain";

function makeProjectDocument(): ProjectDocument {
  return {
    id: "rocket-fc",
    name: "Rocket FC",
    description: "Flight controller planning workspace",
    controllerId: "stm32f405rg",
    status: "Draft",
    voltageDomain: "3.3V",
    template: "Blank project",
    outputTarget: "Generate KiCad starter project",
    components: [
      {
        id: "flash",
        catalogId: "w25q128jv",
        instanceName: "Flash",
        status: "Unconnected",
        preferredProtocol: "SPI"
      },
      {
        id: "imu",
        catalogId: "icm-42688-p",
        instanceName: "Primary IMU",
        status: "Unconnected",
        preferredProtocol: "SPI"
      }
    ],
    connections: [],
    issues: [],
    createdAt: "2026-04-07T00:00:00.000Z",
    updatedAt: "2026-04-07T00:00:00.000Z"
  };
}

describe("connection planner", () => {
  it("auto-assigns a dedicated SPI connection deterministically", () => {
    const workspace = resolveProjectDocument(
      applyDerivedProjectState(makeProjectDocument())
    );
    const initialDraft = buildConnectionDraft(workspace, "flash");

    expect(initialDraft).not.toBeNull();

    const configuredDraft = autoAssignDraft(workspace, {
      ...initialDraft!,
      protocol: "SPI",
      controllerInterface: "SPI1",
      busMode: "Dedicated"
    });

    const connection = buildConnectionRecordFromDraft(
      workspace,
      configuredDraft
    );

    expect(connection?.assignments).toEqual([
      {
        signal: "SCK",
        selectedPin: "PA5",
        alternatePins: ["PB3"],
        status: "Valid"
      },
      {
        signal: "MISO",
        selectedPin: "PA6",
        alternatePins: ["PB4"],
        status: "Valid"
      },
      {
        signal: "MOSI",
        selectedPin: "PA7",
        alternatePins: ["PB5"],
        status: "Valid"
      },
      {
        signal: "CS",
        selectedPin: "PB0",
        alternatePins: [
          "PB1",
          "PC4",
          "PC5",
          "PC6",
          "PC7",
          "PA0",
          "PA1",
          "PB2",
          "PB12",
          "PA8",
          "PA15",
          "PC13",
          "PB8",
          "PB9",
          "PB10",
          "PB11"
        ],
        status: "Valid"
      }
    ]);
    expect(connection?.status).toBe("Valid");
  });

  it("reuses shared SPI bus pins and blocks dedicated reuse", () => {
    const project = makeProjectDocument();
    const baseWorkspace = resolveProjectDocument(
      applyDerivedProjectState(project)
    );
    const flashDraft = autoAssignDraft(baseWorkspace, {
      ...buildConnectionDraft(baseWorkspace, "flash")!,
      protocol: "SPI",
      controllerInterface: "SPI1",
      busMode: "Shared"
    });
    const flashConnection = buildConnectionRecordFromDraft(
      baseWorkspace,
      flashDraft
    )!;

    const withFlashWorkspace = resolveProjectDocument(
      applyDerivedProjectState({
        ...project,
        connections: [flashConnection]
      })
    );

    const spiInterfaces = getInterfaceOptions(withFlashWorkspace, "SPI");
    expect(
      spiInterfaces.find((option) => option.name === "SPI1")
    ).toMatchObject({
      allowsDedicated: false,
      allowsShared: true,
      disabled: false
    });

    const imuDraft = autoAssignDraft(withFlashWorkspace, {
      ...buildConnectionDraft(withFlashWorkspace, "imu")!,
      protocol: "SPI",
      controllerInterface: "SPI1",
      busMode: "Shared"
    });
    const imuConnection = buildConnectionRecordFromDraft(
      withFlashWorkspace,
      imuDraft
    );

    expect(imuConnection?.assignments[0]?.selectedPin).toBe("PA5");
    expect(imuConnection?.assignments[1]?.selectedPin).toBe("PA6");
    expect(imuConnection?.assignments[2]?.selectedPin).toBe("PA7");
    expect(imuConnection?.assignments[3]?.selectedPin).toBe("PB1");
  });

  it("summarizes connected devices and clean validation state", () => {
    const project = makeProjectDocument();
    const baseWorkspace = resolveProjectDocument(
      applyDerivedProjectState(project)
    );
    const flashDraft = autoAssignDraft(baseWorkspace, {
      ...buildConnectionDraft(baseWorkspace, "flash")!,
      protocol: "SPI",
      controllerInterface: "SPI1",
      busMode: "Dedicated"
    });
    const flashConnection = buildConnectionRecordFromDraft(
      baseWorkspace,
      flashDraft
    )!;
    const withFlashWorkspace = resolveProjectDocument(
      applyDerivedProjectState({
        ...project,
        connections: [flashConnection]
      })
    );
    const imuDraft = autoAssignDraft(withFlashWorkspace, {
      ...buildConnectionDraft(withFlashWorkspace, "imu")!,
      protocol: "SPI",
      controllerInterface: "SPI2",
      busMode: "Dedicated"
    });
    const imuConnection = buildConnectionRecordFromDraft(
      withFlashWorkspace,
      imuDraft
    )!;

    const derivedProject = applyDerivedProjectState({
      ...project,
      connections: [flashConnection, imuConnection]
    });

    expect(getProjectValidationSummary(derivedProject)).toEqual({
      totalDevices: 2,
      connectedDevices: 2,
      savedConnections: 2,
      unresolvedIssues: 0,
      errorConflicts: 0,
      warningCount: 0,
      optionalSignalCount: 0,
      optionalUnresolved: 0
    });
  });

  it("summarizes missing required assignments and optional unresolved warnings", () => {
    const project = makeProjectDocument();
    const workspace = resolveProjectDocument(applyDerivedProjectState(project));
    const incompleteRequiredDraft = autoAssignDraft(workspace, {
      ...buildConnectionDraft(workspace, "flash")!,
      protocol: "SPI",
      controllerInterface: "SPI1",
      busMode: "Dedicated",
      enabledOptionalSignals: ["HOLD"]
    });
    const flashConnection = buildConnectionRecordFromDraft(workspace, {
      ...incompleteRequiredDraft,
      assignments: {
        ...incompleteRequiredDraft.assignments,
        MISO: "",
        HOLD: ""
      }
    })!;
    const derivedProject = applyDerivedProjectState({
      ...project,
      connections: [flashConnection]
    });

    expect(getProjectValidationSummary(derivedProject)).toEqual({
      totalDevices: 2,
      connectedDevices: 0,
      savedConnections: 1,
      unresolvedIssues: 3,
      errorConflicts: 0,
      warningCount: 1,
      optionalSignalCount: 1,
      optionalUnresolved: 1
    });
  });

  it("summarizes saved pin conflicts from derived issues", () => {
    const project = makeProjectDocument();
    const baseWorkspace = resolveProjectDocument(
      applyDerivedProjectState(project)
    );
    const flashDraft = autoAssignDraft(baseWorkspace, {
      ...buildConnectionDraft(baseWorkspace, "flash")!,
      protocol: "SPI",
      controllerInterface: "SPI1",
      busMode: "Dedicated"
    });
    const flashConnection = buildConnectionRecordFromDraft(
      baseWorkspace,
      flashDraft
    )!;
    const flashChipSelect = flashConnection.assignments.find(
      (assignment) => assignment.signal === "CS"
    )?.selectedPin;
    const withFlashWorkspace = resolveProjectDocument(
      applyDerivedProjectState({
        ...project,
        connections: [flashConnection]
      })
    );
    const imuDraft = autoAssignDraft(withFlashWorkspace, {
      ...buildConnectionDraft(withFlashWorkspace, "imu")!,
      protocol: "SPI",
      controllerInterface: "SPI2",
      busMode: "Dedicated"
    });
    const conflictingImuConnection = buildConnectionRecordFromDraft(
      withFlashWorkspace,
      {
        ...imuDraft,
        assignments: {
          ...imuDraft.assignments,
          CS: flashChipSelect ?? ""
        }
      }
    )!;
    const derivedProject = applyDerivedProjectState({
      ...project,
      connections: [flashConnection, conflictingImuConnection]
    });

    expect(getProjectValidationSummary(derivedProject)).toEqual({
      totalDevices: 2,
      connectedDevices: 0,
      savedConnections: 2,
      unresolvedIssues: 2,
      errorConflicts: 2,
      warningCount: 0,
      optionalSignalCount: 0,
      optionalUnresolved: 0
    });
  });
});
