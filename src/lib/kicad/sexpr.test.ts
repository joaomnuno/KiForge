import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  parse,
  toNumber,
  head,
  isList,
  findChild,
  findChildren,
  KicadParseError
} from "./sexpr";

const fixturesDir = join(
  dirname(fileURLToPath(import.meta.url)),
  "__fixtures__"
);
const readFixture = (name: string) =>
  readFileSync(join(fixturesDir, name), "utf8");

describe("sexpr parse", () => {
  it("parses an empty list", () => {
    const root = parse("()");
    expect(root.kind).toBe("list");
    expect(root.items).toEqual([]);
  });

  it("parses atoms with letters, digits, dashes, dots, and underscores", () => {
    const root = parse("(version 20231120 stm32f4-rg foo.bar baz_qux)");
    expect(root.items.map((n) => (n.kind === "atom" ? n.value : null))).toEqual(
      ["version", "20231120", "stm32f4-rg", "foo.bar", "baz_qux"]
    );
  });

  it("parses a quoted string and distinguishes it from a bare atom", () => {
    const root = parse('(generator "kiforge")');
    expect(root.items[1].kind).toBe("string");
    if (root.items[1].kind === "string") {
      expect(root.items[1].value).toBe("kiforge");
    }
  });

  it('decodes standard string escapes (\\n, \\t, \\r, \\", \\\\)', () => {
    const root = parse('(s "a\\nb\\tc\\rd\\"e\\\\f")');
    const node = root.items[1];
    expect(node.kind).toBe("string");
    if (node.kind === "string") {
      expect(node.value).toBe('a\nb\tc\rd"e\\f');
    }
  });

  it("treats UUIDs as atoms, not numbers", () => {
    const root = parse("(uuid 00000000-0000-0000-0000-000000000001)");
    const uuid = root.items[1];
    expect(uuid.kind).toBe("atom");
    if (uuid.kind === "atom") {
      expect(uuid.value).toBe("00000000-0000-0000-0000-000000000001");
      expect(toNumber(uuid)).toBeNull();
    }
  });

  it("nests lists arbitrarily deep", () => {
    const root = parse("(a (b (c (d 1))))");
    expect(head(root)?.value).toBe("a");
    const b = root.items[1];
    expect(isList(b, "b")).toBe(true);
    if (b.kind === "list") {
      const c = b.items[1];
      expect(isList(c, "c")).toBe(true);
      if (c.kind === "list") {
        const d = c.items[1];
        expect(isList(d, "d")).toBe(true);
      }
    }
  });

  it("preserves source positions on every node", () => {
    const root = parse("(version\n  20231120)");
    const version = root.items[0];
    expect(version.pos.line).toBe(1);
    expect(version.pos.column).toBe(2);
    const num = root.items[1];
    expect(num.pos.line).toBe(2);
  });

  it("rejects an unterminated string", () => {
    expect(() => parse('(s "unterminated')).toThrow(KicadParseError);
  });

  it("rejects an unterminated list", () => {
    expect(() => parse("(a (b)")).toThrow(KicadParseError);
  });

  it("rejects trailing content after the root list", () => {
    expect(() => parse("(a) (b)")).toThrow(KicadParseError);
  });

  it("rejects a top-level atom (must be a list)", () => {
    expect(() => parse("foo")).toThrow(KicadParseError);
  });

  it("rejects a stray closing paren", () => {
    expect(() => parse(")")).toThrow(KicadParseError);
  });

  it("parses the minimal .kicad_sch fixture", () => {
    const root = parse(readFixture("minimal.kicad_sch"));
    expect(head(root)?.value).toBe("kicad_sch");
    const version = findChild(root, "version");
    expect(version).not.toBeNull();
    expect(version && toNumber(version.items[1])).toBe(20231120);
    const generator = findChild(root, "generator");
    expect(generator?.items[1].kind).toBe("string");
    const lib = findChild(root, "lib_symbols");
    expect(lib).not.toBeNull();
    expect(lib?.items).toHaveLength(1); // just the head atom
  });

  it("decodes escapes inside the strings-and-escapes fixture", () => {
    const root = parse(readFixture("strings-and-escapes.kicad_sch"));
    const titleBlock = findChild(root, "title_block");
    expect(titleBlock).not.toBeNull();
    const title = titleBlock && findChild(titleBlock, "title");
    expect(title?.items[1].kind).toBe("string");
    if (title?.items[1].kind === "string") {
      expect(title.items[1].value).toBe('Project "Alpha"\nrev 1');
    }
    const comments = titleBlock ? findChildren(titleBlock, "comment") : [];
    expect(comments).toHaveLength(2);
    const tabComment = comments[0].items[2];
    if (tabComment.kind === "string") {
      expect(tabComment.value).toBe("Tab:\there");
    }
    const pathComment = comments[1].items[2];
    if (pathComment.kind === "string") {
      expect(pathComment.value).toBe("Path: C:\\Users\\dev");
    }
  });
});
