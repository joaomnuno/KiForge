import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { describe, expect, it } from "vitest";
import { parseKicadPro, KicadProParseError } from "./kicad-pro";

const fixturesDir = join(
  dirname(fileURLToPath(import.meta.url)),
  "__fixtures__"
);
const readFixture = (name: string) =>
  readFileSync(join(fixturesDir, name), "utf8");

describe("parseKicadPro", () => {
  it("parses the minimal fixture and extracts meta", () => {
    const doc = parseKicadPro(readFixture("minimal.kicad_pro"));
    expect(doc.meta.version).toBe(1);
    expect(doc.meta.filename).toBe("minimal.kicad_pro");
  });

  it("keeps the rest of the document as opaque raw data", () => {
    const doc = parseKicadPro(readFixture("minimal.kicad_pro"));
    expect(doc.raw.schematic).toBeDefined();
    expect(doc.raw.pcb).toBeDefined();
  });

  it("omits filename when the source omits it", () => {
    const doc = parseKicadPro(JSON.stringify({ meta: { version: 1 } }));
    expect(doc.meta.filename).toBeUndefined();
  });

  it("rejects non-JSON input", () => {
    expect(() => parseKicadPro("not json {")).toThrow(KicadProParseError);
  });

  it("rejects JSON that isn't an object at the root", () => {
    expect(() => parseKicadPro("[]")).toThrow(KicadProParseError);
    expect(() => parseKicadPro("42")).toThrow(KicadProParseError);
  });

  it("rejects a document missing meta", () => {
    expect(() => parseKicadPro(JSON.stringify({ schematic: {} }))).toThrow(
      /missing the required "meta" object/
    );
  });

  it("rejects a meta missing a numeric version", () => {
    expect(() =>
      parseKicadPro(JSON.stringify({ meta: { filename: "x" } }))
    ).toThrow(/version" must be a finite number/);
  });

  it("rejects a non-string filename", () => {
    expect(() =>
      parseKicadPro(JSON.stringify({ meta: { version: 1, filename: 42 } }))
    ).toThrow(/filename" must be a string/);
  });
});
