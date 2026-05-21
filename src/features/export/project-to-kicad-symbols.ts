/**
 * Maps a `WorkspaceProject` to the `SchematicSymbol[]` the KiCad bundle
 * exporter places in the generated `.kicad_sch`.
 *
 * Pure function. Skips parts whose catalog entry has no `kicadLibId`
 * (those have no stock KiCad symbol; embedding inline `lib_symbols`
 * blocks is a post-beta enhancement — see the post-beta queue in
 * `docs/beta-checklist.md`).
 *
 * Layout: simple horizontal row at y=50mm, 50mm spacing, starting at
 * x=50mm. Controller is placed first (reference `U1`), then components
 * in the order they appear on the project. Real layout/auto-router is
 * KiCad's job — KiForge only seeds the schematic with placed symbols.
 */

import type { SchematicSymbol } from "../../lib/kicad";
import type { WorkspaceProject } from "../../types/domain";

const ORIGIN_X_MM = 50;
const ORIGIN_Y_MM = 50;
const STEP_X_MM = 50;

export interface ProjectToKicadSymbolsOptions {
  /** Override the UUID generator for deterministic tests. */
  uuid?: () => string;
}

export function projectToKicadSymbols(
  project: WorkspaceProject,
  options: ProjectToKicadSymbolsOptions = {}
): SchematicSymbol[] {
  const uuid = options.uuid ?? (() => crypto.randomUUID());
  const placed: SchematicSymbol[] = [];
  let referenceIndex = 1;
  let x = ORIGIN_X_MM;

  const controllerLibId = project.controller.kicadLibId;
  if (controllerLibId) {
    placed.push({
      libId: controllerLibId,
      at: { x, y: ORIGIN_Y_MM },
      uuid: uuid(),
      properties: [
        { name: "Reference", value: `U${referenceIndex}` },
        { name: "Value", value: project.controller.name }
      ]
    });
    referenceIndex += 1;
    x += STEP_X_MM;
  }

  for (const component of project.components) {
    const libId = component.part.kicadLibId;
    if (!libId) {
      continue;
    }
    placed.push({
      libId,
      at: { x, y: ORIGIN_Y_MM },
      uuid: uuid(),
      properties: [
        { name: "Reference", value: `U${referenceIndex}` },
        { name: "Value", value: component.part.name }
      ]
    });
    referenceIndex += 1;
    x += STEP_X_MM;
  }

  return placed;
}
