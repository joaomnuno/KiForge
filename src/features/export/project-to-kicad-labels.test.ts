import { describe, expect, it } from "vitest";
import { catalog } from "../catalog/catalog";
import { loadVendoredSymbols } from "../catalog/load-vendored-symbol";
import { projectToKicadHierarchicalLabels } from "./project-to-kicad-labels";
import { projectToKicadSymbolPlacements } from "./project-to-kicad-symbols";
import type {
  ComponentCatalogEntry,
  ControllerCatalogEntry,
  WorkspaceProject,
  WorkspaceProjectComponent
} from "../../types/domain";

function requireCatalogEntry<T extends { id: string }>(
  entries: readonly T[],
  id: string
) {
  const entry = entries.find((candidate) => candidate.id === id);
  if (!entry) {
    throw new Error(`Missing catalog entry ${id}`);
  }
  return entry;
}

function component(
  id: string,
  part: ComponentCatalogEntry
): WorkspaceProjectComponent {
  return {
    id,
    catalogId: part.id,
    instanceName: id,
    status: "Connected",
    preferredProtocol: "UART",
    part,
    partName: part.name,
    supportedProtocols: part.supportedProtocols
  };
}

function project(
  controller: ControllerCatalogEntry,
  components: WorkspaceProjectComponent[]
): WorkspaceProject {
  return {
    id: "uart-board",
    name: "UART board",
    description: "",
    status: "Ready to Generate",
    voltageDomain: "3.3V",
    template: "blank",
    outputTarget: "Generate KiCad starter project",
    controller,
    components,
    connections: [
      {
        id: "conn-uart",
        componentId: components[0].id,
        name: "USB UART",
        peerPart: components[0].part.name,
        protocol: "UART",
        controllerInterface: "UART0",
        pins: ["GPIO0", "GPIO1"],
        busMode: "Dedicated",
        optionalSignals: [],
        status: "Valid",
        assignments: [
          {
            signal: "TX",
            selectedPin: "GPIO0",
            alternatePins: [],
            status: "Valid"
          },
          {
            signal: "RX",
            selectedPin: "GPIO1",
            alternatePins: [],
            status: "Valid"
          }
        ]
      }
    ],
    issues: [],
    createdAt: "2026-05-22T00:00:00.000Z",
    updatedAt: "2026-05-22T00:00:00.000Z"
  };
}

function makeUuidFactory() {
  let n = 0;
  return () => {
    n += 1;
    return `bbbbbbbb-bbbb-bbbb-bbbb-${String(n).padStart(12, "0")}`;
  };
}

describe("projectToKicadHierarchicalLabels", () => {
  it("places matching UART labels directly on RP2040 and CH340K pin endpoints", () => {
    const rp2040 = requireCatalogEntry(catalog.controllers, "rp2040");
    const ch340k = requireCatalogEntry(catalog.components, "ch340k");
    const workspace = project(rp2040, [component("usb-uart", ch340k)]);
    const placements = projectToKicadSymbolPlacements(workspace, {
      uuid: makeUuidFactory()
    });

    const labels = projectToKicadHierarchicalLabels(workspace, placements, {
      vendoredSymbols: loadVendoredSymbols(),
      uuid: makeUuidFactory()
    });

    expect(labels).toHaveLength(4);
    expect(labels).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          text: "UART_TXD",
          at: { x: 88.9, y: 36.83, angle: 0 },
          justify: "left"
        }),
        expect.objectContaining({
          text: "UART_TXD",
          at: { x: 121.92, y: 68.58, angle: 180 },
          justify: "right"
        }),
        expect.objectContaining({
          text: "UART_RXD",
          at: { x: 88.9, y: 39.37, angle: 0 },
          justify: "left"
        }),
        expect.objectContaining({
          text: "UART_RXD",
          at: { x: 121.92, y: 71.12, angle: 180 },
          justify: "right"
        })
      ])
    );
  });
});
