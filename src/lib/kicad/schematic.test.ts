import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  readSchematic,
  readSymbol,
  readWire,
  symbolNode,
  wireNode,
  type SchematicSymbol,
  type SchematicWire
} from "./schematic";
import { KicadParseError, parse } from "./sexpr";
import { stringify } from "./stringify";

const fixturesDir = join(
  dirname(fileURLToPath(import.meta.url)),
  "__fixtures__"
);
const readFixture = (name: string) =>
  readFileSync(join(fixturesDir, name), "utf8");

describe("readSchematic", () => {
  it("extracts header fields from the minimal fixture", () => {
    const sch = readSchematic(parse(readFixture("minimal.kicad_sch")));
    expect(sch.version).toBe(20250114);
    expect(sch.generator).toBe("kiforge");
    expect(sch.uuid).toBe("00000000-0000-0000-0000-000000000001");
    expect(sch.paper).toBe("A4");
    expect(sch.symbols).toEqual([]);
    expect(sch.wires).toEqual([]);
  });

  it("extracts a placed symbol and wire from the with-symbol fixture", () => {
    const sch = readSchematic(
      parse(readFixture("with-symbol-and-wire.kicad_sch"))
    );
    expect(sch.symbols).toHaveLength(1);
    const sym = sch.symbols[0];
    expect(sym.libId).toBe("Device:R");
    expect(sym.at).toEqual({ x: 100.5, y: 50, angle: 90 });
    expect(sym.uuid).toBe("11111111-1111-1111-1111-111111111111");
    expect(sym.properties).toEqual([
      { name: "Reference", value: "R1" },
      { name: "Value", value: "10k" }
    ]);
    expect(sch.wires).toHaveLength(1);
    const wire = sch.wires[0];
    expect(wire.pts).toEqual([
      { x: 100, y: 50 },
      { x: 110, y: 50 }
    ]);
    expect(wire.uuid).toBe("22222222-2222-2222-2222-222222222222");
  });

  it("rejects a non-kicad_sch root list", () => {
    expect(() => readSchematic(parse("(notaschematic)"))).toThrow(
      KicadParseError
    );
  });

  it("rejects a schematic missing required header fields", () => {
    expect(() => readSchematic(parse("(kicad_sch)"))).toThrow(
      /missing \(version/
    );
  });
});

describe("readSymbol", () => {
  it("rejects a non-symbol list", () => {
    expect(() => readSymbol(parse("(wire)"))).toThrow(KicadParseError);
  });

  it("rejects a symbol missing lib_id", () => {
    expect(() => readSymbol(parse('(symbol (at 0 0) (uuid "abc"))'))).toThrow(
      /missing \(lib_id/
    );
  });

  it("accepts a symbol with no rotation angle (2D position only)", () => {
    const sym = readSymbol(
      parse('(symbol (lib_id "X:Y") (at 1 2) (uuid "abc"))')
    );
    expect(sym.at).toEqual({ x: 1, y: 2 });
    expect(sym.at.angle).toBeUndefined();
  });
});

describe("readWire", () => {
  it("rejects a wire with fewer than two points", () => {
    expect(() => readWire(parse("(wire (pts (xy 0 0)))"))).toThrow(
      /at least two points/
    );
  });

  it("omits the uuid field when the wire has none", () => {
    const wire = readWire(parse("(wire (pts (xy 0 0) (xy 10 0)))"));
    expect(wire.uuid).toBeUndefined();
  });
});

describe("symbolNode / wireNode round-trip", () => {
  it("symbolNode → stringify → parse → readSymbol recovers the input", () => {
    const original: SchematicSymbol = {
      libId: "Device:C",
      at: { x: 12.7, y: 25.4, angle: 0 },
      uuid: "33333333-3333-3333-3333-333333333333",
      properties: [
        { name: "Reference", value: "C7" },
        { name: "Value", value: '100 "nF"' },
        { name: "Footprint", value: "Capacitor_SMD:C_0603" }
      ]
    };
    const text = stringify(symbolNode(original));
    const reparsed = readSymbol(parse(text));
    expect(reparsed).toEqual(original);
  });

  it("wireNode → stringify → parse → readWire recovers the input", () => {
    const original: SchematicWire = {
      pts: [
        { x: 0, y: 0 },
        { x: 50.8, y: 0 },
        { x: 50.8, y: 25.4 }
      ],
      uuid: "44444444-4444-4444-4444-444444444444"
    };
    const text = stringify(wireNode(original));
    const reparsed = readWire(parse(text));
    expect(reparsed).toEqual(original);
  });

  it("wireNode without uuid round-trips without one", () => {
    const original: SchematicWire = {
      pts: [
        { x: 0, y: 0 },
        { x: 5, y: 0 }
      ]
    };
    const reparsed = readWire(parse(stringify(wireNode(original))));
    expect(reparsed.pts).toEqual(original.pts);
    expect(reparsed.uuid).toBeUndefined();
  });
});
