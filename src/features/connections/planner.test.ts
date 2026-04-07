import { resolveProjectDocument } from "../projects/project-mappers";
import {
  applyDerivedProjectState,
  autoAssignDraft,
  buildConnectionDraft,
  buildConnectionRecordFromDraft,
  getInterfaceOptions
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
    const workspace = resolveProjectDocument(applyDerivedProjectState(makeProjectDocument()));
    const initialDraft = buildConnectionDraft(workspace, "flash");

    expect(initialDraft).not.toBeNull();

    const configuredDraft = autoAssignDraft(workspace, {
      ...initialDraft!,
      protocol: "SPI",
      controllerInterface: "SPI1",
      busMode: "Dedicated"
    });

    const connection = buildConnectionRecordFromDraft(workspace, configuredDraft);

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
    const baseWorkspace = resolveProjectDocument(applyDerivedProjectState(project));
    const flashDraft = autoAssignDraft(baseWorkspace, {
      ...buildConnectionDraft(baseWorkspace, "flash")!,
      protocol: "SPI",
      controllerInterface: "SPI1",
      busMode: "Shared"
    });
    const flashConnection = buildConnectionRecordFromDraft(baseWorkspace, flashDraft)!;

    const withFlashWorkspace = resolveProjectDocument(
      applyDerivedProjectState({
        ...project,
        connections: [flashConnection]
      })
    );

    const spiInterfaces = getInterfaceOptions(withFlashWorkspace, "SPI");
    expect(spiInterfaces.find((option) => option.name === "SPI1")).toMatchObject({
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
    const imuConnection = buildConnectionRecordFromDraft(withFlashWorkspace, imuDraft);

    expect(imuConnection?.assignments[0]?.selectedPin).toBe("PA5");
    expect(imuConnection?.assignments[1]?.selectedPin).toBe("PA6");
    expect(imuConnection?.assignments[2]?.selectedPin).toBe("PA7");
    expect(imuConnection?.assignments[3]?.selectedPin).toBe("PB1");
  });
});
