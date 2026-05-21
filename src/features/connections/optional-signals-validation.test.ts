import { describe, expect, it } from "vitest";
import { validateOptionalSignalsCoverage } from "./optional-signals-validation";
import type {
  ComponentCatalogEntry,
  ComponentConnectionOption,
  ControllerCatalogEntry,
  WorkspaceConnection,
  WorkspaceProject,
  WorkspaceProjectComponent
} from "../../types/domain";

function controller(): ControllerCatalogEntry {
  return {
    id: "stm32",
    name: "STM32",
    packageName: "LQFP-64",
    voltage: "3.3V",
    notes: "",
    protocols: ["SPI", "I2C"],
    interfaces: [],
    gpioPins: []
  };
}

function spiOption(
  ...optionalSignalNames: string[]
): ComponentConnectionOption {
  return {
    protocol: "SPI",
    notes: "SPI",
    optionalSignals: optionalSignalNames.map((name) => ({
      name,
      source: "gpio",
      sharedBehavior: "unique"
    }))
  };
}

function part(
  id: string,
  overrides: Partial<ComponentCatalogEntry> = {}
): ComponentCatalogEntry {
  return {
    id,
    name: id.toUpperCase(),
    categoryId: "sensor",
    categoryLabel: "Sensor",
    summary: "",
    voltage: "3.3V",
    packageName: "QFN-14",
    supportedProtocols: ["SPI"],
    connectionOptions: [spiOption("INT", "RESET")],
    ...overrides
  };
}

function component(
  id: string,
  partEntry: ComponentCatalogEntry,
  instanceName = id
): WorkspaceProjectComponent {
  return {
    id,
    catalogId: partEntry.id,
    instanceName,
    status: "Connected",
    preferredProtocol: "SPI",
    part: partEntry,
    partName: partEntry.name,
    supportedProtocols: partEntry.supportedProtocols
  };
}

function connection(
  id: string,
  componentId: string,
  optionalSignals: string[] = []
): WorkspaceConnection {
  return {
    id,
    componentId,
    protocol: "SPI",
    controllerInterface: "SPI1",
    pins: ["PA5", "PA6", "PA7"],
    busMode: "Dedicated",
    optionalSignals,
    status: "Valid",
    assignments: [],
    name: componentId,
    peerPart: componentId
  };
}

function project(
  components: WorkspaceProjectComponent[],
  connections: WorkspaceConnection[]
): WorkspaceProject {
  return {
    id: "x",
    name: "X",
    description: "",
    status: "Draft",
    voltageDomain: "3.3V",
    template: "blank",
    outputTarget: "Generate KiCad starter project",
    controller: controller(),
    components,
    connections,
    issues: [],
    createdAt: "2026-05-21T00:00:00.000Z",
    updatedAt: "2026-05-21T00:00:00.000Z"
  };
}

describe("validateOptionalSignalsCoverage", () => {
  it("emits one info issue per unconnected optional signal", () => {
    const flash = part("flash");
    const issues = validateOptionalSignalsCoverage(
      project([component("c1", flash, "Flash")], [connection("conn1", "c1")])
    );
    expect(issues).toHaveLength(2);
    expect(issues.map((i) => i.id).sort()).toEqual([
      "conn1-optional-INT-missing",
      "conn1-optional-RESET-missing"
    ]);
    for (const issue of issues) {
      expect(issue.severity).toBe("info");
      expect(issue.message).toContain("Flash");
      expect(issue.message).toContain("FLASH");
    }
  });

  it("does not warn for optional signals the user has enabled", () => {
    const flash = part("flash");
    const issues = validateOptionalSignalsCoverage(
      project([component("c1", flash)], [connection("conn1", "c1", ["INT"])])
    );
    expect(issues.map((i) => i.id)).toEqual(["conn1-optional-RESET-missing"]);
  });

  it("emits nothing when every optional signal is enabled", () => {
    const flash = part("flash");
    const issues = validateOptionalSignalsCoverage(
      project(
        [component("c1", flash)],
        [connection("conn1", "c1", ["INT", "RESET"])]
      )
    );
    expect(issues).toEqual([]);
  });

  it("skips components whose catalog entry has no optional signals for this protocol", () => {
    const noOptional = part("plain", {
      connectionOptions: [spiOption()]
    });
    const issues = validateOptionalSignalsCoverage(
      project([component("c1", noOptional)], [connection("conn1", "c1")])
    );
    expect(issues).toEqual([]);
  });

  it("skips connections whose protocol is not a planner protocol", () => {
    const flash = part("flash");
    const conn = connection("conn1", "c1");
    conn.protocol = "GPIO";
    const issues = validateOptionalSignalsCoverage(
      project([component("c1", flash)], [conn])
    );
    expect(issues).toEqual([]);
  });

  it("skips a connection whose component has no catalog entry", () => {
    const flash = part("flash");
    const conn = connection("conn1", "missing-id");
    const issues = validateOptionalSignalsCoverage(
      project([component("c1", flash)], [conn])
    );
    expect(issues).toEqual([]);
  });
});
