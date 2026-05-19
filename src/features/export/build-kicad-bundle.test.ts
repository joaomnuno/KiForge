import { describe, expect, it } from "vitest";
import { buildKicadBundle } from "./build-kicad-bundle";
import { findChild, head, parse, parseKicadPro } from "../../lib/kicad";
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

describe("buildKicadBundle", () => {
  it("emits a .kicad_sch and a .kicad_pro named after the project id", () => {
    const files = buildKicadBundle(mkProject());
    expect(Object.keys(files).sort()).toEqual([
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
});
