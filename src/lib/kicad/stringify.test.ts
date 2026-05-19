import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { describe, expect, it } from "vitest";
import { atom, str, list, keywordList, schematicHeader } from "./builder";
import { findChild, head, parse } from "./sexpr";
import { stringify } from "./stringify";

const fixturesDir = join(
  dirname(fileURLToPath(import.meta.url)),
  "__fixtures__"
);
const readFixture = (name: string) =>
  readFileSync(join(fixturesDir, name), "utf8");

describe("stringify", () => {
  it("emits a single-line list when all items are leaves", () => {
    const out = stringify(list(atom("version"), atom("20231120")));
    expect(out).toBe("(version 20231120)\n");
  });

  it("escapes special characters in strings", () => {
    const out = stringify(list(atom("s"), str('say "hi"\nrow2\tcol\\path')));
    expect(out).toBe('(s "say \\"hi\\"\\nrow2\\tcol\\\\path")\n');
  });

  it("emits a multi-line list with head atom on the opening line", () => {
    const root = list(
      atom("kicad_sch"),
      keywordList("version", atom("20231120")),
      keywordList("generator", str("kiforge"))
    );
    const out = stringify(root);
    expect(out).toBe(
      "(kicad_sch\n" +
        "\t(version 20231120)\n" +
        '\t(generator "kiforge")\n' +
        ")\n"
    );
  });

  it("collapses empty multi-line lists (no children) to (head)", () => {
    const root = list(
      atom("root"),
      keywordList("a"),
      list(atom("kicad_sch"), keywordList("version", atom("1")))
    );
    const out = stringify(root);
    expect(out).toContain("(a)");
  });

  it("round-trips arbitrary AST through stringify + parse", () => {
    const original = list(
      atom("kicad_sch"),
      keywordList("version", atom("20231120")),
      keywordList("generator", str("kiforge")),
      keywordList("uuid", str("11111111-2222-3333-4444-555555555555")),
      keywordList("paper", str("A4"))
    );
    const text = stringify(original);
    const reparsed = parse(text);
    expect(head(reparsed)?.value).toBe("kicad_sch");
    expect(findChild(reparsed, "paper")?.items[1].kind).toBe("string");
  });

  it("round-trips the minimal fixture (parse → stringify → parse)", () => {
    const original = parse(readFixture("minimal.kicad_sch"));
    const text = stringify(original);
    const reparsed = parse(text);
    expect(head(reparsed)?.value).toBe("kicad_sch");
    expect(findChild(reparsed, "lib_symbols")).not.toBeNull();
    expect(findChild(reparsed, "symbol_instances")).not.toBeNull();
  });

  it('round-trips strings with escapes (\\", \\n, \\t, \\\\)', () => {
    const original = parse(readFixture("strings-and-escapes.kicad_sch"));
    const text = stringify(original);
    const reparsed = parse(text);
    const titleBlock = findChild(reparsed, "title_block");
    const title = titleBlock && findChild(titleBlock, "title");
    if (title && title.items[1].kind === "string") {
      expect(title.items[1].value).toBe('Project "Alpha"\nrev 1');
    }
  });

  it("schematicHeader → stringify produces well-formed KiCad output", () => {
    const root = schematicHeader({
      uuid: "deadbeef-dead-beef-dead-beefdeadbeef"
    });
    const text = stringify(root);
    expect(text.startsWith("(kicad_sch\n")).toBe(true);
    expect(text.includes('(uuid "deadbeef-dead-beef-dead-beefdeadbeef")')).toBe(
      true
    );
    expect(text.endsWith(")\n")).toBe(true);
    // Re-parse must succeed and recover head.
    expect(head(parse(text))?.value).toBe("kicad_sch");
  });
});
