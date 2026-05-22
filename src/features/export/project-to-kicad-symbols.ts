/**
 * Maps a `WorkspaceProject` to the `SchematicSymbol[]` the KiCad bundle
 * exporter places in the generated `.kicad_sch`.
 *
 * Pure function. Skips parts whose catalog entry has no `kicadLibId`
 * (those have no stock KiCad symbol; embedding inline `lib_symbols`
 * blocks is a post-beta enhancement — see the post-beta queue in
 * `docs/beta-checklist.md`).
 *
 * Layout: simple mil-grid placement converted to KiCad's millimeter file
 * units. Controller is placed first (reference `U1`), then components in
 * the order they appear on the project. Real layout/auto-router is KiCad's
 * job — KiForge only seeds the schematic with placed symbols.
 */

import type { SchematicPosition, SchematicSymbol } from "../../lib/kicad";
import type { WorkspaceProject } from "../../types/domain";

const MM_PER_MIL = 0.0254;

function mils(value: number) {
  return Number((value * MM_PER_MIL).toFixed(4));
}

const ORIGIN_X_MM = mils(2500);
const ORIGIN_Y_MM = mils(2950);
const STEP_X_MM = mils(2000);
const RP2040_STEP_X_MM = mils(2900);
const CH340K_Y_MM = mils(2700);

interface PropertyOffsets {
  reference: SchematicPosition;
  value: SchematicPosition;
}

export interface ProjectKicadSymbolPlacement {
  owner: "controller" | "component";
  componentId?: string;
  symbol: SchematicSymbol;
}

export interface ProjectToKicadSymbolsOptions {
  /** Override the UUID generator for deterministic tests. */
  uuid?: () => string;
}

function addPosition(
  origin: SchematicPosition,
  offset: SchematicPosition
): SchematicPosition {
  const roundMm = (value: number) => Number(value.toFixed(4));
  return {
    x: roundMm(origin.x + offset.x),
    y: roundMm(origin.y + offset.y),
    angle: offset.angle ?? origin.angle ?? 0
  };
}

function propertyOffsetsForLibId(libId: string): PropertyOffsets {
  if (libId === "MCU_RaspberryPi:RP2040") {
    return {
      reference: { x: 2.1433, y: 44.45, angle: 0 },
      value: { x: 2.1433, y: 46.99, angle: 0 }
    };
  }

  if (libId === "CH340K:CH340K") {
    return {
      reference: { x: 0, y: -20.32, angle: 0 },
      value: { x: 0, y: -17.78, angle: 0 }
    };
  }

  return {
    reference: { x: 0, y: -7.62, angle: 0 },
    value: { x: 0, y: -5.08, angle: 0 }
  };
}

function makeSymbol(
  libId: string,
  at: SchematicPosition,
  uuid: string,
  reference: string,
  value: string
): SchematicSymbol {
  const offsets = propertyOffsetsForLibId(libId);
  return {
    libId,
    at,
    uuid,
    fieldsAutoplaced: true,
    properties: [
      {
        name: "Reference",
        value: reference,
        at: addPosition(at, offsets.reference)
      },
      { name: "Value", value, at: addPosition(at, offsets.value) }
    ]
  };
}

function spacingAfterSymbol(libId: string) {
  if (libId === "MCU_RaspberryPi:RP2040") {
    return RP2040_STEP_X_MM;
  }

  return STEP_X_MM;
}

function yForSymbol(libId: string) {
  if (libId === "CH340K:CH340K") {
    return CH340K_Y_MM;
  }

  return ORIGIN_Y_MM;
}

export function projectToKicadSymbolPlacements(
  project: WorkspaceProject,
  options: ProjectToKicadSymbolsOptions = {}
): ProjectKicadSymbolPlacement[] {
  const uuid = options.uuid ?? (() => crypto.randomUUID());
  const placed: ProjectKicadSymbolPlacement[] = [];
  let referenceIndex = 1;
  let x = ORIGIN_X_MM;

  const controllerLibId = project.controller.kicadLibId;
  if (controllerLibId) {
    const at = { x, y: yForSymbol(controllerLibId) };
    placed.push({
      owner: "controller",
      symbol: makeSymbol(
        controllerLibId,
        at,
        uuid(),
        `U${referenceIndex}`,
        project.controller.name
      )
    });
    referenceIndex += 1;
    x += spacingAfterSymbol(controllerLibId);
  }

  for (const component of project.components) {
    const libId = component.part.kicadLibId;
    if (!libId) {
      continue;
    }
    const at = { x, y: yForSymbol(libId) };
    placed.push({
      owner: "component",
      componentId: component.id,
      symbol: makeSymbol(
        libId,
        at,
        uuid(),
        `U${referenceIndex}`,
        component.part.name
      )
    });
    referenceIndex += 1;
    x += spacingAfterSymbol(libId);
  }

  return placed;
}

export function projectToKicadSymbols(
  project: WorkspaceProject,
  options: ProjectToKicadSymbolsOptions = {}
): SchematicSymbol[] {
  return projectToKicadSymbolPlacements(project, options).map(
    (placement) => placement.symbol
  );
}
