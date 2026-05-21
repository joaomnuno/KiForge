/**
 * Project state → KiCad starter bundle (in-memory files map).
 *
 * Pure function: takes a `ProjectDocument`, returns
 * `{ "<id>.kicad_sch": "...", "<id>.kicad_pro": "..." }`. The Tauri
 * side accepts this map and writes each entry atomically next to
 * `project.json` (separate slice).
 *
 * Without `symbols`/`wires` options the schematic is header-only and
 * KiCad opens it cleanly. Pass `symbols`/`wires` to embed placed
 * content — the next slice maps a project's controller + connections
 * into those arrays.
 *
 * Pass `vendoredSymbols` to inline the bodies of any placed symbols
 * whose `lib_id` matches a key in the map. The bodies are parsed into
 * the AST and pushed into the schematic's `(lib_symbols ...)` block
 * in deterministic (sorted by `lib_id`) order, deduped. When the map
 * is absent the `(lib_symbols ...)` block stays empty — the existing
 * pre-vendoring behavior.
 */

import {
  findChild,
  parse,
  schematicHeader,
  stringify,
  symbolNode,
  wireNode,
  type SchematicSymbol,
  type SchematicWire,
  type SList
} from "../../lib/kicad";
import type { ProjectDocument } from "../../types/domain";

export interface KicadBundleOptions {
  /** Override the generated schematic UUID. Tests pass a fixed value. */
  schematicUuid?: string;
  /** Override the `generator` field written into the schematic. */
  generator?: string;
  /** Symbols to place in the schematic. Empty by default. */
  symbols?: SchematicSymbol[];
  /** Wires to add to the schematic. Empty by default. */
  wires?: SchematicWire[];
  /**
   * Vendored symbol bodies keyed by `lib_id` (e.g.
   * `"BMP388:BMP388"` → `"(symbol \"BMP388\" ...)"`). Any placed
   * symbol whose `libId` matches a key has the corresponding body
   * inlined into the schematic's `(lib_symbols ...)` block so KiCad
   * can render the part without an external library lookup. When
   * absent, `(lib_symbols ...)` stays empty.
   */
  vendoredSymbols?: Map<string, string>;
}

export type KicadBundleFiles = Record<string, string>;

const KICAD_PRO_SCHEMA_VERSION = 1;

function collectVendoredSymbolNodes(
  symbols: readonly SchematicSymbol[],
  vendoredSymbols: Map<string, string>
): SList[] {
  const placedLibIds = new Set<string>();
  for (const placed of symbols) {
    if (vendoredSymbols.has(placed.libId)) {
      placedLibIds.add(placed.libId);
    }
  }
  return Array.from(placedLibIds)
    .sort()
    .map((libId) => {
      const body = vendoredSymbols.get(libId);
      if (body === undefined) {
        throw new Error(
          `Vendored symbol body for "${libId}" disappeared between lookup and parse`
        );
      }
      return parse(body);
    });
}

export function buildKicadBundle(
  project: ProjectDocument,
  options: KicadBundleOptions = {}
): KicadBundleFiles {
  const baseName = project.id;
  const uuid = options.schematicUuid ?? crypto.randomUUID();
  const generator = options.generator ?? "kiforge";
  const symbols = options.symbols ?? [];
  const wires = options.wires ?? [];
  const vendoredSymbols = options.vendoredSymbols;

  const root = schematicHeader({ uuid, generator });

  if (vendoredSymbols && vendoredSymbols.size > 0) {
    const libSymbols = findChild(root, "lib_symbols");
    if (!libSymbols) {
      throw new Error(
        "Schematic header missing (lib_symbols ...) block; cannot inline vendored symbols"
      );
    }
    for (const node of collectVendoredSymbolNodes(symbols, vendoredSymbols)) {
      libSymbols.items.push(node);
    }
  }

  for (const symbol of symbols) {
    root.items.push(symbolNode(symbol));
  }
  for (const wire of wires) {
    root.items.push(wireNode(wire));
  }

  const sch = stringify(root);

  const pro =
    JSON.stringify(
      {
        meta: {
          filename: `${baseName}.kicad_pro`,
          version: KICAD_PRO_SCHEMA_VERSION
        },
        schematic: {},
        pcb: {}
      },
      null,
      2
    ) + "\n";

  return {
    [`${baseName}.kicad_sch`]: sch,
    [`${baseName}.kicad_pro`]: pro
  };
}
