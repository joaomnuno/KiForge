import { describe, expect, it } from "vitest";
import { buildKicadBundle } from "./build-kicad-bundle";
import {
  findChild,
  findChildren,
  head,
  KICAD_SCHEMATIC_VERSION,
  KIFORGE_GENERATOR_VERSION,
  parse,
  parseKicadPro,
  readSchematic,
  toNumber,
  type SchematicHierarchicalLabel,
  type SchematicSymbol,
  type SchematicWire,
  type SList,
  type SNode
} from "../../lib/kicad";
import { loadVendoredSymbols, parseRaw } from "../catalog/load-vendored-symbol";
import type { ProjectDocument } from "../../types/domain";

function mkProject(over: Partial<ProjectDocument> = {}): ProjectDocument {
  return {
    id: "rocket-fc-rev-a",
    name: "Rocket FC Rev A",
    description: "",
    controllerId: "stm32f405rg",
    status: "Draft",
    voltageDomain: "3.3V",
    template: "blank",
    outputTarget: "Generate KiCad starter project",
    components: [],
    connections: [],
    issues: [],
    createdAt: new Date(0).toISOString(),
    updatedAt: new Date(0).toISOString(),
    ...over
  };
}

function vendoredSymbolBody(raw: string, libId: string): SList {
  const body = parseRaw(raw).get(libId);
  if (!body) {
    throw new Error(`Missing vendored body for ${libId}`);
  }
  return body;
}

function stringArg(node: SList, index: number): string | null {
  const child = node.items[index];
  return child?.kind === "string" ? child.value : null;
}

function collectLists(node: SNode, keyword: string): SList[] {
  if (node.kind !== "list") {
    return [];
  }

  const matches = head(node)?.value === keyword ? [node] : [];
  return matches.concat(
    node.items.flatMap((child) => collectLists(child, keyword))
  );
}

function pinPairs(symbol: SList) {
  return collectLists(symbol, "pin").map((pin) => ({
    name: stringArg(findChild(pin, "name")!, 1),
    number: stringArg(findChild(pin, "number")!, 1)
  }));
}

describe("buildKicadBundle", () => {
  it("emits a .kicad_sch and a .kicad_pro named after the project id, plus the license notice", () => {
    const files = buildKicadBundle(mkProject());
    expect(Object.keys(files).sort()).toEqual([
      "KIFORGE-LICENSE.txt",
      "rocket-fc-rev-a.kicad_pro",
      "rocket-fc-rev-a.kicad_sch"
    ]);
  });

  it("schematic file parses as a valid kicad_sch root", () => {
    const files = buildKicadBundle(mkProject(), {
      schematicUuid: "abcd-1234"
    });
    const root = parse(files["rocket-fc-rev-a.kicad_sch"]);
    expect(head(root)?.value).toBe("kicad_sch");
    const uuid = findChild(root, "uuid");
    expect(
      uuid && uuid.items[1].kind === "string" ? uuid.items[1].value : null
    ).toBe("abcd-1234");
  });

  it("schematic file carries the configured generator", () => {
    const files = buildKicadBundle(mkProject(), { generator: "kiforge-test" });
    const root = parse(files["rocket-fc-rev-a.kicad_sch"]);
    const gen = findChild(root, "generator");
    expect(
      gen && gen.items[1].kind === "string" ? gen.items[1].value : null
    ).toBe("kiforge-test");
  });

  it("schematic file uses the KiCad 9 schematic version and KiForge generator version", () => {
    const files = buildKicadBundle(mkProject());
    const root = parse(files["rocket-fc-rev-a.kicad_sch"]);
    const version = findChild(root, "version");
    expect(version && toNumber(version.items[1])).toBe(KICAD_SCHEMATIC_VERSION);
    const generatorVersion = findChild(root, "generator_version");
    expect(stringArg(generatorVersion!, 1)).toBe(KIFORGE_GENERATOR_VERSION);
  });

  it("project file parses as a valid .kicad_pro with version 1", () => {
    const files = buildKicadBundle(mkProject());
    const doc = parseKicadPro(files["rocket-fc-rev-a.kicad_pro"]);
    expect(doc.meta.version).toBe(1);
    expect(doc.meta.filename).toBe("rocket-fc-rev-a.kicad_pro");
    expect(doc.raw.schematic).toBeDefined();
    expect(doc.raw.pcb).toBeDefined();
  });

  it("generates a unique UUID per call when not supplied", () => {
    const a = parse(buildKicadBundle(mkProject())["rocket-fc-rev-a.kicad_sch"]);
    const b = parse(buildKicadBundle(mkProject())["rocket-fc-rev-a.kicad_sch"]);
    const ua = findChild(a, "uuid");
    const ub = findChild(b, "uuid");
    const va = ua && ua.items[1].kind === "string" ? ua.items[1].value : null;
    const vb = ub && ub.items[1].kind === "string" ? ub.items[1].value : null;
    expect(va).not.toBeNull();
    expect(vb).not.toBeNull();
    expect(va).not.toBe(vb);
    expect(va).toMatch(/^[0-9a-f-]+$/i);
  });

  it("uses the project id as the .kicad_pro meta.filename", () => {
    const files = buildKicadBundle(mkProject({ id: "telemetry-node-v2" }));
    const doc = parseKicadPro(files["telemetry-node-v2.kicad_pro"]);
    expect(doc.meta.filename).toBe("telemetry-node-v2.kicad_pro");
  });

  it("emits no symbols or wires when neither option is provided", () => {
    const files = buildKicadBundle(mkProject());
    const root = parse(files["rocket-fc-rev-a.kicad_sch"]);
    expect(findChildren(root, "symbol")).toHaveLength(0);
    expect(findChildren(root, "wire")).toHaveLength(0);
  });

  it("embeds placed symbols passed via options", () => {
    const symbol: SchematicSymbol = {
      libId: "MCU_ST_STM32F4:STM32F405RGTx",
      at: { x: 100, y: 50, angle: 0 },
      uuid: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      properties: [
        { name: "Reference", value: "U1" },
        { name: "Value", value: "STM32F405RGTx" }
      ]
    };
    const files = buildKicadBundle(mkProject(), { symbols: [symbol] });
    const sch = readSchematic(parse(files["rocket-fc-rev-a.kicad_sch"]));
    expect(sch.symbols).toHaveLength(1);
    expect(sch.symbols[0]).toEqual(symbol);
  });

  it("embeds wires passed via options", () => {
    const wire: SchematicWire = {
      pts: [
        { x: 0, y: 0 },
        { x: 50, y: 0 }
      ],
      uuid: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"
    };
    const files = buildKicadBundle(mkProject(), { wires: [wire] });
    const sch = readSchematic(parse(files["rocket-fc-rev-a.kicad_sch"]));
    expect(sch.wires).toHaveLength(1);
    expect(sch.wires[0]).toEqual(wire);
  });

  it("embeds hierarchical labels passed via options", () => {
    const label: SchematicHierarchicalLabel = {
      text: "UART_TXD",
      at: { x: 75.4, y: 88.1, angle: 0 },
      justify: "left",
      uuid: "cccccccc-cccc-cccc-cccc-cccccccccccc"
    };
    const files = buildKicadBundle(mkProject(), {
      hierarchicalLabels: [label]
    });
    const root = parse(files["rocket-fc-rev-a.kicad_sch"]);
    const labels = findChildren(root, "hierarchical_label");
    expect(labels).toHaveLength(1);
    expect(stringArg(labels[0], 1)).toBe("UART_TXD");
    const at = findChild(labels[0], "at");
    expect(at && toNumber(at.items[1])).toBe(75.4);
    expect(at && toNumber(at.items[2])).toBe(88.1);
  });

  it("preserves order: header keys first, then symbols, then wires", () => {
    const symbol: SchematicSymbol = {
      libId: "X:Y",
      at: { x: 0, y: 0 },
      uuid: "11111111-1111-1111-1111-111111111111",
      properties: []
    };
    const wire: SchematicWire = {
      pts: [
        { x: 0, y: 0 },
        { x: 10, y: 0 }
      ]
    };
    const files = buildKicadBundle(mkProject(), {
      symbols: [symbol],
      wires: [wire]
    });
    const root = parse(files["rocket-fc-rev-a.kicad_sch"]);
    // items[0] is the head atom `kicad_sch`; the rest are child lists.
    const childHeads = root.items
      .slice(1)
      .map((item) =>
        item.kind === "list" && item.items[0]?.kind === "atom"
          ? item.items[0].value
          : null
      );
    expect(childHeads).toEqual([
      "version",
      "generator",
      "generator_version",
      "uuid",
      "paper",
      "lib_symbols",
      "symbol_instances",
      "symbol",
      "wire"
    ]);
  });

  it("leaves lib_symbols empty when no vendoredSymbols map is provided", () => {
    const symbol: SchematicSymbol = {
      libId: "BMP388:BMP388",
      at: { x: 0, y: 0 },
      uuid: "22222222-2222-2222-2222-222222222222",
      properties: []
    };
    const files = buildKicadBundle(mkProject(), { symbols: [symbol] });
    const root = parse(files["rocket-fc-rev-a.kicad_sch"]);
    const libSymbols = findChild(root, "lib_symbols");
    expect(libSymbols).not.toBeNull();
    // Just the head atom `lib_symbols`, no children.
    expect(libSymbols?.items).toHaveLength(1);
  });

  it("places a vendored symbol body in lib_symbols when libId matches", () => {
    const symbol: SchematicSymbol = {
      libId: "BMP388:BMP388",
      at: { x: 0, y: 0 },
      uuid: "33333333-3333-3333-3333-333333333333",
      properties: []
    };
    const vendoredBody = vendoredSymbolBody(
      '(kicad_symbol_lib (version 20231120) (generator "kiforge-test") (symbol "BMP388:BMP388" (pin_numbers hide) (pin_names (offset 1.016)) (in_bom yes) (on_board yes)))',
      "BMP388:BMP388"
    );
    const files = buildKicadBundle(mkProject(), {
      symbols: [symbol],
      vendoredSymbols: new Map([["BMP388:BMP388", vendoredBody]])
    });
    const root = parse(files["rocket-fc-rev-a.kicad_sch"]);
    const libSymbols = findChild(root, "lib_symbols");
    expect(libSymbols).not.toBeNull();
    const childSymbols = findChildren(libSymbols!, "symbol");
    expect(childSymbols).toHaveLength(1);
    const nameNode = childSymbols[0].items[1];
    expect(nameNode.kind).toBe("string");
    if (nameNode.kind === "string") {
      expect(nameNode.value).toBe("BMP388:BMP388");
    }
  });

  it("dedupes the vendored body when multiple instances share a libId", () => {
    const first: SchematicSymbol = {
      libId: "BMP388:BMP388",
      at: { x: 0, y: 0 },
      uuid: "44444444-4444-4444-4444-444444444444",
      properties: []
    };
    const second: SchematicSymbol = {
      libId: "BMP388:BMP388",
      at: { x: 50, y: 0 },
      uuid: "55555555-5555-5555-5555-555555555555",
      properties: []
    };
    const vendoredBody = vendoredSymbolBody(
      '(kicad_symbol_lib (version 20231120) (generator "kiforge-test") (symbol "BMP388:BMP388" (in_bom yes) (on_board yes)))',
      "BMP388:BMP388"
    );
    const files = buildKicadBundle(mkProject(), {
      symbols: [first, second],
      vendoredSymbols: new Map([["BMP388:BMP388", vendoredBody]])
    });
    const root = parse(files["rocket-fc-rev-a.kicad_sch"]);
    const libSymbols = findChild(root, "lib_symbols");
    expect(libSymbols).not.toBeNull();
    const matching = findChildren(libSymbols!, "symbol").filter((child) => {
      const nameNode = child.items[1];
      return nameNode.kind === "string" && nameNode.value === "BMP388:BMP388";
    });
    expect(matching).toHaveLength(1);
  });

  it("embeds the vendored TagConnect catalog symbol body", () => {
    const libId = "TagConnect:Conn_ARM_SWD_TagConnect_TC2030";
    const body = loadVendoredSymbols().get(libId);
    if (!body) {
      throw new Error(`Missing vendored body for ${libId}`);
    }

    const symbol: SchematicSymbol = {
      libId,
      at: { x: 25.4, y: 25.4, angle: 0 },
      uuid: "66666666-6666-6666-6666-666666666666",
      properties: []
    };
    const files = buildKicadBundle(mkProject(), {
      symbols: [symbol],
      vendoredSymbols: new Map([[libId, body]])
    });
    const root = parse(files["rocket-fc-rev-a.kicad_sch"]);
    const libSymbols = findChild(root, "lib_symbols");
    expect(libSymbols).not.toBeNull();
    const childSymbols = findChildren(libSymbols!, "symbol");
    expect(childSymbols).toHaveLength(1);
    const nameNode = childSymbols[0].items[1];
    expect(nameNode.kind === "string" ? nameNode.value : null).toBe(libId);
  });

  it("embeds the vendored BMP388 catalog symbol body", () => {
    const libId = "BMP388:BMP388";
    const body = loadVendoredSymbols().get(libId);
    if (!body) {
      throw new Error(`Missing vendored body for ${libId}`);
    }

    const symbol: SchematicSymbol = {
      libId,
      at: { x: 50.8, y: 25.4, angle: 0 },
      uuid: "77777777-7777-7777-7777-777777777777",
      properties: []
    };
    const files = buildKicadBundle(mkProject(), {
      symbols: [symbol],
      vendoredSymbols: new Map([[libId, body]])
    });
    const root = parse(files["rocket-fc-rev-a.kicad_sch"]);
    const libSymbols = findChild(root, "lib_symbols");
    expect(libSymbols).not.toBeNull();
    const childSymbols = findChildren(libSymbols!, "symbol");
    expect(childSymbols).toHaveLength(1);
    const nameNode = childSymbols[0].items[1];
    expect(nameNode.kind === "string" ? nameNode.value : null).toBe(libId);
  });

  it("embeds the vendored CH340K SnapEDA symbol body", () => {
    const libId = "CH340K:CH340K";
    const body = loadVendoredSymbols().get(libId);
    if (!body) {
      throw new Error(`Missing vendored body for ${libId}`);
    }

    const symbol: SchematicSymbol = {
      libId,
      at: { x: 25.4, y: 25.4, angle: 0 },
      uuid: "88888888-8888-8888-8888-888888888888",
      properties: []
    };
    const files = buildKicadBundle(mkProject(), {
      symbols: [symbol],
      vendoredSymbols: new Map([[libId, body]])
    });
    const root = parse(files["rocket-fc-rev-a.kicad_sch"]);
    const libSymbols = findChild(root, "lib_symbols");
    expect(libSymbols).not.toBeNull();
    const childSymbols = findChildren(libSymbols!, "symbol");
    expect(childSymbols).toHaveLength(1);
    const nameNode = childSymbols[0].items[1];
    expect(nameNode.kind === "string" ? nameNode.value : null).toBe(libId);
  });

  it("embeds the vendored RP2040 KiCad official symbol body and key pins", () => {
    const libId = "MCU_RaspberryPi:RP2040";
    const body = loadVendoredSymbols().get(libId);
    if (!body) {
      throw new Error(`Missing vendored body for ${libId}`);
    }

    const symbol: SchematicSymbol = {
      libId,
      at: { x: 25.4, y: 25.4, angle: 0 },
      uuid: "99999999-9999-9999-9999-999999999999",
      properties: []
    };
    const files = buildKicadBundle(mkProject(), {
      symbols: [symbol],
      vendoredSymbols: new Map([[libId, body]])
    });
    const root = parse(files["rocket-fc-rev-a.kicad_sch"]);
    const libSymbols = findChild(root, "lib_symbols");
    expect(libSymbols).not.toBeNull();
    const childSymbols = findChildren(libSymbols!, "symbol");
    const rp2040 = childSymbols.find((child) => stringArg(child, 1) === libId);
    expect(rp2040).toBeDefined();
    expect(pinPairs(rp2040!)).toEqual(
      expect.arrayContaining([
        { name: "USB_DM", number: "46" },
        { name: "USB_DP", number: "47" },
        { name: "GPIO0", number: "2" },
        { name: "GPIO29_ADC3", number: "41" }
      ])
    );
  });

  it("emits a KIFORGE-LICENSE.txt with the symbol-source attribution", () => {
    const files = buildKicadBundle(mkProject());
    const notice = files["KIFORGE-LICENSE.txt"];
    expect(notice).toContain("Creative Commons Attribution-ShareAlike 4.0");
    expect(notice).toContain("catalog/symbols/LICENSE.md");
  });

  it("writes a .kicad_sch that starts with the kicad_sch root list (no leading comment)", () => {
    const files = buildKicadBundle(mkProject());
    const sch = files["rocket-fc-rev-a.kicad_sch"];
    // KiCad's schematic parser rejects leading `;;` comments. The
    // very first byte must be `(`.
    expect(sch[0]).toBe("(");
    expect(sch.startsWith("(kicad_sch")).toBe(true);
  });

  it("emits placed symbols with explicit orientation in (at x y angle)", () => {
    const symbol: SchematicSymbol = {
      libId: "X:Y",
      at: { x: 100, y: 50 },
      uuid: "99999999-9999-9999-9999-999999999999",
      properties: [{ name: "Reference", value: "U1" }]
    };
    const files = buildKicadBundle(mkProject(), { symbols: [symbol] });
    const sch = files["rocket-fc-rev-a.kicad_sch"];
    // Placed (symbol …) must carry (at 100 50 0) — the explicit 0 is
    // KiCad's required orientation number.
    expect(sch).toMatch(/\(at 100 50 0\)/);
    // Properties get their own (at … 0) + (effects (font (size …))).
    // Stringify emits these multi-line, so match across whitespace.
    expect(sch).toMatch(/\(property\s+"Reference"\s+"U1"/);
    expect(sch).toMatch(/\(size 1\.27 1\.27\)/);
    expect(sch).toContain("(effects");
    expect(sch).toContain("(font");
  });
});
