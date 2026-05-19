import { describe, expect, it } from "vitest";
import {
  parseVoltageRange,
  validateVoltageCompatibility
} from "./voltage-validation";
import type {
  ComponentCatalogEntry,
  ControllerCatalogEntry,
  WorkspaceProject,
  WorkspaceProjectComponent
} from "../../types/domain";

describe("parseVoltageRange", () => {
  it("parses a single fixed voltage like 3.3V", () => {
    expect(parseVoltageRange("3.3V")).toEqual({ min: 3.3, max: 3.3 });
  });

  it("strips trailing words like 'logic'", () => {
    expect(parseVoltageRange("3.3V logic")).toEqual({ min: 3.3, max: 3.3 });
  });

  it("parses a min-max range with a dash", () => {
    expect(parseVoltageRange("1.65V - 3.6V")).toEqual({
      min: 1.65,
      max: 3.6
    });
    expect(parseVoltageRange("1.71V - 3.6V")).toEqual({
      min: 1.71,
      max: 3.6
    });
    expect(parseVoltageRange("2.7V - 3.6V")).toEqual({ min: 2.7, max: 3.6 });
  });

  it("parses a slash-separated dual rail like 3.3V / 5V", () => {
    expect(parseVoltageRange("3.3V / 5V")).toEqual({ min: 3.3, max: 5 });
  });

  it("returns null for strings with no voltage number", () => {
    expect(parseVoltageRange("Board logic")).toBeNull();
    expect(parseVoltageRange("")).toBeNull();
    expect(parseVoltageRange("varies")).toBeNull();
  });

  it("accepts lowercase v", () => {
    expect(parseVoltageRange("3.3v")).toEqual({ min: 3.3, max: 3.3 });
  });
});

function controller(): ControllerCatalogEntry {
  return {
    id: "stm32",
    name: "STM32",
    packageName: "LQFP-64",
    voltage: "3.3V",
    notes: "",
    protocols: ["SPI"],
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
    packageName: "SOP-8",
    supportedProtocols: ["SPI"],
    connectionOptions: [],
    ...overrides
  };
}

function comp(
  id: string,
  partEntry: ComponentCatalogEntry,
  instanceName = id
): WorkspaceProjectComponent {
  return {
    id,
    catalogId: partEntry.id,
    instanceName,
    status: "Unconnected",
    preferredProtocol: "SPI",
    part: partEntry,
    partName: partEntry.name,
    supportedProtocols: partEntry.supportedProtocols
  };
}

function project(
  components: WorkspaceProjectComponent[],
  domain: WorkspaceProject["voltageDomain"]
): WorkspaceProject {
  return {
    id: "x",
    name: "X",
    description: "",
    status: "Draft",
    voltageDomain: domain,
    template: "blank",
    outputTarget: "Generate KiCad starter project",
    controller: controller(),
    components,
    connections: [],
    issues: [],
    createdAt: "2026-05-19T00:00:00.000Z",
    updatedAt: "2026-05-19T00:00:00.000Z"
  };
}

describe("validateVoltageCompatibility", () => {
  it("returns no issues when the project domain is Mixed", () => {
    const issues = validateVoltageCompatibility(
      project([comp("c1", part("c1", { voltage: "1.71V - 3.6V" }))], "Mixed")
    );
    expect(issues).toEqual([]);
  });

  it("returns no issues when the project domain is Undecided", () => {
    const issues = validateVoltageCompatibility(
      project([comp("c1", part("c1", { voltage: "5V" }))], "Undecided")
    );
    expect(issues).toEqual([]);
  });

  it("returns no issues when every component supports the project domain", () => {
    const issues = validateVoltageCompatibility(
      project(
        [
          comp("flash", part("flash", { voltage: "2.7V - 3.6V" })),
          comp("imu", part("imu", { voltage: "1.65V - 3.6V" }))
        ],
        "3.3V"
      )
    );
    expect(issues).toEqual([]);
  });

  it("warns when a component's range excludes the project domain", () => {
    const issues = validateVoltageCompatibility(
      project(
        [
          comp("flash", part("flash", { voltage: "2.7V - 3.6V" })),
          comp(
            "fivev",
            part("fivev", {
              name: "Five-Volt Sensor",
              voltage: "4.5V - 5.5V"
            }),
            "5V Sensor"
          )
        ],
        "3.3V"
      )
    );
    expect(issues).toHaveLength(1);
    expect(issues[0].id).toBe("fivev-voltage-mismatch");
    expect(issues[0].severity).toBe("warning");
    expect(issues[0].message).toContain("5V Sensor");
    expect(issues[0].message).toContain("Five-Volt Sensor");
    expect(issues[0].message).toContain("4.5V");
    expect(issues[0].message).toContain("3.3V");
  });

  it("skips components whose voltage string is unparseable", () => {
    const issues = validateVoltageCompatibility(
      project([comp("conn", part("conn", { voltage: "Board logic" }))], "3.3V")
    );
    expect(issues).toEqual([]);
  });

  it("warns for a 3.3V-only part on a 5V project", () => {
    const issues = validateVoltageCompatibility(
      project([comp("sense", part("sense", { voltage: "3.3V" }))], "5V")
    );
    expect(issues).toHaveLength(1);
    expect(issues[0].id).toBe("sense-voltage-mismatch");
  });
});
