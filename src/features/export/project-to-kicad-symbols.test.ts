import { describe, expect, it } from "vitest";
import { catalog } from "../catalog/catalog";
import { projectToKicadSymbols } from "./project-to-kicad-symbols";
import type {
  ComponentCatalogEntry,
  ControllerCatalogEntry,
  WorkspaceConnection,
  WorkspaceProject,
  WorkspaceProjectComponent
} from "../../types/domain";

function controller(
  overrides: Partial<ControllerCatalogEntry> = {}
): ControllerCatalogEntry {
  return {
    id: "stm32",
    name: "STM32",
    packageName: "LQFP-64",
    voltage: "3.3V",
    notes: "",
    protocols: ["SPI"],
    interfaces: [],
    gpioPins: [],
    ...overrides
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
    connectionOptions: [],
    ...overrides
  };
}

function component(
  id: string,
  partEntry: ComponentCatalogEntry
): WorkspaceProjectComponent {
  return {
    id,
    catalogId: partEntry.id,
    instanceName: id,
    status: "Connected",
    preferredProtocol: "SPI",
    part: partEntry,
    partName: partEntry.name,
    supportedProtocols: partEntry.supportedProtocols
  };
}

function project(
  controllerEntry: ControllerCatalogEntry,
  components: WorkspaceProjectComponent[],
  connections: WorkspaceConnection[] = []
): WorkspaceProject {
  return {
    id: "x",
    name: "X",
    description: "",
    status: "Draft",
    voltageDomain: "3.3V",
    template: "blank",
    outputTarget: "Generate KiCad starter project",
    controller: controllerEntry,
    components,
    connections,
    issues: [],
    createdAt: "2026-05-21T00:00:00.000Z",
    updatedAt: "2026-05-21T00:00:00.000Z"
  };
}

function makeUuidFactory() {
  let n = 0;
  return () => {
    n += 1;
    return `aaaaaaaa-aaaa-aaaa-aaaa-${String(n).padStart(12, "0")}`;
  };
}

describe("projectToKicadSymbols", () => {
  it("returns an empty array when neither controller nor components have a kicadLibId", () => {
    const symbols = projectToKicadSymbols(
      project(controller(), [component("c1", part("flash"))])
    );
    expect(symbols).toEqual([]);
  });

  it("places the controller first with reference U1 when kicadLibId is set", () => {
    const symbols = projectToKicadSymbols(
      project(controller({ kicadLibId: "MCU_ST_STM32F4:STM32F405RGTx" }), []),
      { uuid: makeUuidFactory() }
    );
    expect(symbols).toHaveLength(1);
    expect(symbols[0].libId).toBe("MCU_ST_STM32F4:STM32F405RGTx");
    expect(symbols[0].at).toEqual({ x: 63.5, y: 74.93 });
    expect(symbols[0].fieldsAutoplaced).toBe(true);
    expect(symbols[0].properties).toMatchObject([
      { name: "Reference", value: "U1", at: { x: 63.5, y: 67.31 } },
      { name: "Value", value: "STM32", at: { x: 63.5, y: 69.85 } }
    ]);
  });

  it("uses the KiCad official RP2040 lib id from the real catalog", () => {
    const rp2040 = catalog.controllers.find(
      (controllerEntry) => controllerEntry.id === "rp2040"
    );
    if (!rp2040) {
      throw new Error("Missing RP2040 catalog entry");
    }

    const symbols = projectToKicadSymbols(project(rp2040, []), {
      uuid: makeUuidFactory()
    });

    expect(symbols).toHaveLength(1);
    expect(symbols[0].libId).toBe("MCU_RaspberryPi:RP2040");
    expect(symbols[0].at).toEqual({ x: 63.5, y: 74.93 });
    expect(symbols[0].properties).toMatchObject([
      { name: "Reference", value: "U1", at: { x: 65.6433, y: 119.38 } },
      { name: "Value", value: "RP2040", at: { x: 65.6433, y: 121.92 } }
    ]);
  });

  it("places the RP2040 and CH340K on the handmade mil-grid coordinates", () => {
    const rp2040 = catalog.controllers.find(
      (controllerEntry) => controllerEntry.id === "rp2040"
    );
    const ch340k = catalog.components.find(
      (componentEntry) => componentEntry.id === "ch340k"
    );
    if (!rp2040 || !ch340k) {
      throw new Error("Missing RP2040 or CH340K catalog entry");
    }

    const symbols = projectToKicadSymbols(
      project(rp2040, [component("usb-uart", ch340k)]),
      { uuid: makeUuidFactory() }
    );

    expect(symbols.map((symbol) => symbol.at)).toEqual([
      { x: 63.5, y: 74.93 },
      { x: 137.16, y: 68.58 }
    ]);
    expect(symbols[1].properties).toMatchObject([
      { name: "Reference", value: "U2", at: { x: 137.16, y: 48.26 } },
      { name: "Value", value: "CH340K", at: { x: 137.16, y: 50.8 } }
    ]);
  });

  it("places components after the controller with stepping x coordinates", () => {
    const symbols = projectToKicadSymbols(
      project(controller({ kicadLibId: "MCU:Ctrl" }), [
        component(
          "flash",
          part("flash", { kicadLibId: "Memory_Flash:W25Q128JVS" })
        ),
        component("imu", part("imu", { kicadLibId: "Sensor_Motion:ICM" }))
      ]),
      { uuid: makeUuidFactory() }
    );
    expect(symbols).toHaveLength(3);
    expect(symbols.map((s) => s.at.x)).toEqual([63.5, 114.3, 165.1]);
    expect(symbols.map((s) => s.at.y)).toEqual([74.93, 74.93, 74.93]);
    expect(symbols.map((s) => s.properties[0].value)).toEqual([
      "U1",
      "U2",
      "U3"
    ]);
  });

  it("skips components whose part has no kicadLibId without disturbing references", () => {
    const symbols = projectToKicadSymbols(
      project(controller({ kicadLibId: "MCU:Ctrl" }), [
        component(
          "flash",
          part("flash", { kicadLibId: "Memory_Flash:W25Q128JVS" })
        ),
        component("noLib", part("noLib")),
        component("imu", part("imu", { kicadLibId: "Sensor_Motion:ICM" }))
      ]),
      { uuid: makeUuidFactory() }
    );
    expect(symbols).toHaveLength(3);
    expect(symbols.map((s) => s.libId)).toEqual([
      "MCU:Ctrl",
      "Memory_Flash:W25Q128JVS",
      "Sensor_Motion:ICM"
    ]);
    expect(symbols.map((s) => s.properties[0].value)).toEqual([
      "U1",
      "U2",
      "U3"
    ]);
  });

  it("uses the injected UUID factory for deterministic ids in tests", () => {
    const symbols = projectToKicadSymbols(
      project(controller({ kicadLibId: "MCU:Ctrl" }), []),
      { uuid: makeUuidFactory() }
    );
    expect(symbols[0].uuid).toBe("aaaaaaaa-aaaa-aaaa-aaaa-000000000001");
  });
});
