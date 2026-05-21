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
 */

import {
  schematicHeader,
  stringify,
  symbolNode,
  wireNode,
  type SchematicSymbol,
  type SchematicWire
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
}

export type KicadBundleFiles = Record<string, string>;

const KICAD_PRO_SCHEMA_VERSION = 1;

export function buildKicadBundle(
  project: ProjectDocument,
  options: KicadBundleOptions = {}
): KicadBundleFiles {
  const baseName = project.id;
  const uuid = options.schematicUuid ?? crypto.randomUUID();
  const generator = options.generator ?? "kiforge";
  const symbols = options.symbols ?? [];
  const wires = options.wires ?? [];

  const root = schematicHeader({ uuid, generator });
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
