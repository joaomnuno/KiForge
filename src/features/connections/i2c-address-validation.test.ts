import { describe, expect, it } from "vitest";
import { validateI2cAddressConflicts } from "./i2c-address-validation";
import type {
  ComponentCatalogEntry,
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
    protocols: ["I2C", "SPI"],
    interfaces: [],
    gpioPins: []
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
    supportedProtocols: ["I2C"],
    connectionOptions: [],
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
    preferredProtocol: "I2C",
    part: partEntry,
    partName: partEntry.name,
    supportedProtocols: partEntry.supportedProtocols
  };
}

function connection(
  id: string,
  componentId: string,
  controllerInterface: string,
  protocol: WorkspaceConnection["protocol"] = "I2C"
): WorkspaceConnection {
  return {
    id,
    componentId,
    protocol,
    controllerInterface,
    pins: ["PB6", "PB7"],
    busMode: "Shared",
    optionalSignals: [],
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
    createdAt: "2026-05-19T00:00:00.000Z",
    updatedAt: "2026-05-19T00:00:00.000Z"
  };
}

describe("validateI2cAddressConflicts", () => {
  it("returns no issues when there are no I2C connections", () => {
    const issues = validateI2cAddressConflicts(
      project(
        [component("flash", part("flash", { i2cAddress: "0x50" }))],
        [connection("c1", "flash", "SPI1", "SPI")]
      )
    );
    expect(issues).toEqual([]);
  });

  it("returns no issues when two I2C components on the same bus have different addresses", () => {
    const issues = validateI2cAddressConflicts(
      project(
        [
          component("baro", part("baro", { i2cAddress: "0x76" })),
          component("imu", part("imu", { i2cAddress: "0x68" }))
        ],
        [connection("c1", "baro", "I2C1"), connection("c2", "imu", "I2C1")]
      )
    );
    expect(issues).toEqual([]);
  });

  it("returns no issues when two components share an address but on different buses", () => {
    const issues = validateI2cAddressConflicts(
      project(
        [
          component("baro1", part("baro1", { i2cAddress: "0x76" }), "Baro 1"),
          component("baro2", part("baro2", { i2cAddress: "0x76" }), "Baro 2")
        ],
        [connection("c1", "baro1", "I2C1"), connection("c2", "baro2", "I2C2")]
      )
    );
    expect(issues).toEqual([]);
  });

  it("flags both components when they share an address on the same bus", () => {
    const issues = validateI2cAddressConflicts(
      project(
        [
          component("baro1", part("baro1", { i2cAddress: "0x76" }), "Baro 1"),
          component("baro2", part("baro2", { i2cAddress: "0x76" }), "Baro 2")
        ],
        [connection("c1", "baro1", "I2C1"), connection("c2", "baro2", "I2C1")]
      )
    );
    expect(issues).toHaveLength(2);
    expect(issues.map((i) => i.id).sort()).toEqual([
      "baro1-i2c-address-conflict-I2C1",
      "baro2-i2c-address-conflict-I2C1"
    ]);
    for (const issue of issues) {
      expect(issue.severity).toBe("error");
      expect(issue.message).toContain("0x76");
      expect(issue.message).toContain("I2C1");
      expect(issue.message).toContain("Baro 1");
      expect(issue.message).toContain("Baro 2");
    }
  });

  it("normalizes case so 0X76 and 0x76 are treated as the same address", () => {
    const issues = validateI2cAddressConflicts(
      project(
        [
          component("baro1", part("baro1", { i2cAddress: "0X76" }), "Baro 1"),
          component("baro2", part("baro2", { i2cAddress: "0x76" }), "Baro 2")
        ],
        [connection("c1", "baro1", "I2C1"), connection("c2", "baro2", "I2C1")]
      )
    );
    expect(issues).toHaveLength(2);
  });

  it("skips components without an i2cAddress", () => {
    const issues = validateI2cAddressConflicts(
      project(
        [
          component("baro", part("baro", { i2cAddress: "0x76" })),
          component("display", part("display"))
        ],
        [connection("c1", "baro", "I2C1"), connection("c2", "display", "I2C1")]
      )
    );
    expect(issues).toEqual([]);
  });
});
