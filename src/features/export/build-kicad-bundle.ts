/**
 * Project state → KiCad starter bundle (in-memory files map).
 *
 * Pure function: takes a `ProjectDocument`, returns
 * `{ "<id>.kicad_sch": "...", "<id>.kicad_pro": "..." }`. The Tauri
 * side will accept this map and write each entry atomically next to
 * `project.json` (separate PR).
 *
 * Today's slice emits a valid-but-empty schematic — header only, no
 * symbol placement, no wires. KiCad opens it cleanly. Symbol placement
 * lands when the .kicad_sch semantic walker does.
 */

import { schematicHeader, stringify } from "../../lib/kicad";
import type { ProjectDocument } from "../../types/domain";

export interface KicadBundleOptions {
  /** Override the generated schematic UUID. Tests pass a fixed value. */
  schematicUuid?: string;
  /** Override the `generator` field written into the schematic. */
  generator?: string;
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

  const sch = stringify(schematicHeader({ uuid, generator }));

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
