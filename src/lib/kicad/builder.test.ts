import { describe, expect, it } from "vitest";
import {
  KICAD_SCHEMATIC_VERSION,
  KIFORGE_GENERATOR_VERSION,
  atom,
  str,
  list,
  keywordList,
  schematicHeader
} from "./builder";
import { findChild, head, parse, toNumber } from "./sexpr";
import { stringify } from "./stringify";

describe("builder", () => {
  it("atom() builds an atom node", () => {
    const node = atom("20231120");
    expect(node.kind).toBe("atom");
    expect(node.value).toBe("20231120");
  });

  it("str() builds a string node", () => {
    const node = str("kiforge");
    expect(node.kind).toBe("string");
    expect(node.value).toBe("kiforge");
  });

  it("list() builds a list with the given items", () => {
    const node = list(atom("a"), atom("b"));
    expect(node.kind).toBe("list");
    expect(node.items).toHaveLength(2);
  });

  it("keywordList() prepends the head atom", () => {
    const node = keywordList("version", atom("1"));
    expect(head(node)?.value).toBe("version");
    expect(node.items[1].kind).toBe("atom");
  });

  it("schematicHeader() builds a minimal .kicad_sch root", () => {
    const root = schematicHeader({ uuid: "abc-def" });
    expect(head(root)?.value).toBe("kicad_sch");
    expect(findChild(root, "version")).not.toBeNull();
    expect(findChild(root, "generator")).not.toBeNull();
    expect(findChild(root, "generator_version")).not.toBeNull();
    expect(findChild(root, "uuid")).not.toBeNull();
    expect(findChild(root, "paper")).not.toBeNull();
    expect(findChild(root, "lib_symbols")).not.toBeNull();
    expect(findChild(root, "symbol_instances")).not.toBeNull();
  });

  it("schematicHeader() defaults are sensible", () => {
    const root = schematicHeader({ uuid: "abc-def" });
    const version = findChild(root, "version");
    expect(version && toNumber(version.items[1])).toBe(KICAD_SCHEMATIC_VERSION);
    const generator = findChild(root, "generator");
    expect(
      generator && generator.items[1].kind === "string"
        ? generator.items[1].value
        : null
    ).toBe("kiforge");
    const generatorVersion = findChild(root, "generator_version");
    expect(
      generatorVersion && generatorVersion.items[1].kind === "string"
        ? generatorVersion.items[1].value
        : null
    ).toBe(KIFORGE_GENERATOR_VERSION);
    const paper = findChild(root, "paper");
    expect(
      paper && paper.items[1].kind === "string" ? paper.items[1].value : null
    ).toBe("A4");
  });

  it("schematicHeader() round-trips through stringify + parse", () => {
    const root = schematicHeader({
      uuid: "00000000-0000-0000-0000-000000000001"
    });
    const text = stringify(root);
    const reparsed = parse(text);
    expect(head(reparsed)?.value).toBe("kicad_sch");
    const uuid = findChild(reparsed, "uuid");
    expect(
      uuid && uuid.items[1].kind === "string" ? uuid.items[1].value : null
    ).toBe("00000000-0000-0000-0000-000000000001");
  });
});
