/**
 * Builders for KiCad S-expression AST nodes.
 *
 * Symmetric to the parser in `sexpr.ts` — useful both for tests
 * (constructing expected AST shapes) and for the export path (turning
 * project state into the AST that `stringify.ts` will serialize).
 *
 * Nodes built here carry a synthetic source position so any error
 * raised downstream still type-checks against `SourcePos`.
 */

import type { SAtom, SList, SNode, SString, SourcePos } from "./sexpr";

const SYNTHETIC: SourcePos = { line: 0, column: 0, offset: 0 };

export function atom(value: string): SAtom {
  return { kind: "atom", value, pos: SYNTHETIC };
}

export function str(value: string): SString {
  return { kind: "string", value, pos: SYNTHETIC };
}

export function list(...items: SNode[]): SList {
  return { kind: "list", items, pos: SYNTHETIC };
}

/** Convenience: `(<keyword> <args...>)`. */
export function keywordList(keyword: string, ...args: SNode[]): SList {
  return list(atom(keyword), ...args);
}

export interface SchematicHeaderOptions {
  /** KiCad sets this to a date stamp like `20231120`. */
  version?: number;
  /** Identifies the writing tool. */
  generator?: string;
  /** UUIDv4 string identifying the schematic. */
  uuid: string;
  /** Paper size token, e.g. `"A4"`, `"USLetter"`. */
  paper?: string;
}

/**
 * Build a minimal `.kicad_sch` root list. Mirrors the shape of
 * `__fixtures__/minimal.kicad_sch`. Returns just the header — semantic
 * content (symbols, wires, junctions) is added by callers in follow-up
 * slices.
 */
export function schematicHeader(opts: SchematicHeaderOptions): SList {
  return list(
    atom("kicad_sch"),
    keywordList("version", atom(String(opts.version ?? 20231120))),
    keywordList("generator", str(opts.generator ?? "kiforge")),
    keywordList("uuid", str(opts.uuid)),
    keywordList("paper", str(opts.paper ?? "A4")),
    keywordList("lib_symbols"),
    keywordList("symbol_instances")
  );
}
