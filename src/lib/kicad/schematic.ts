/**
 * Typed semantic view of a `.kicad_sch` AST.
 *
 * Sits on top of the generic AST in `sexpr.ts` and the builders in
 * `builder.ts`. Provides:
 *
 *   readSchematic(root)   -> Schematic
 *   readSymbol(node)      -> SchematicSymbol
 *   readWire(node)        -> SchematicWire
 *   symbolNode(symbol)    -> SList
 *   wireNode(wire)        -> SList
 *
 * Today's slice covers the minimum the exporter needs to place a
 * controller and wire one peripheral: `lib_id`, `at`, `uuid`, and
 * simple `property` rows for symbols; `pts` (xy pairs) + optional
 * `uuid` for wires. Per-pin stroke/effects/font tokens are intentionally
 * NOT modelled — they default to KiCad's own values when KiCad reopens
 * the file, which is fine for a starter bundle.
 */

import {
  KicadParseError,
  findChild,
  findChildren,
  head,
  toNumber,
  type SList,
  type SNode
} from "./sexpr";
import { atom, keywordList, list, str } from "./builder";

export interface SchematicPosition {
  x: number;
  y: number;
  angle?: number;
}

export interface SchematicPoint {
  x: number;
  y: number;
}

export interface SchematicSymbolProperty {
  name: string;
  value: string;
  at?: SchematicPosition;
}

export interface SchematicSymbol {
  libId: string;
  at: SchematicPosition;
  uuid: string;
  fieldsAutoplaced?: boolean;
  properties: SchematicSymbolProperty[];
}

export interface SchematicWire {
  pts: SchematicPoint[];
  uuid?: string;
}

export interface SchematicHierarchicalLabel {
  text: string;
  at: SchematicPosition;
  uuid: string;
  shape?: "input" | "output" | "bidirectional" | "tri_state" | "passive";
  justify?: "left" | "right" | "top" | "bottom";
}

export interface Schematic {
  version: number;
  generator: string;
  uuid: string;
  paper: string;
  symbols: SchematicSymbol[];
  wires: SchematicWire[];
}

// ---------- readers ----------

function readNumberAt(node: SNode, label: string): number {
  const value = toNumber(node);
  if (value === null) {
    throw new KicadParseError(`Expected number for ${label}`, node.pos);
  }
  return value;
}

function readPosition(node: SList): SchematicPosition {
  if (node.items.length < 3) {
    throw new KicadParseError("(at ...) needs at least x and y", node.pos);
  }
  const x = readNumberAt(node.items[1], "x in (at ...)");
  const y = readNumberAt(node.items[2], "y in (at ...)");
  if (node.items.length >= 4) {
    return { x, y, angle: readNumberAt(node.items[3], "angle in (at ...)") };
  }
  return { x, y };
}

function requireString(node: SNode, label: string): string {
  if (node.kind !== "string") {
    throw new KicadParseError(`Expected string for ${label}`, node.pos);
  }
  return node.value;
}

function readProperty(node: SList): SchematicSymbolProperty {
  if (node.items.length < 3) {
    throw new KicadParseError(
      "(property ...) needs at least a name and a value",
      node.pos
    );
  }
  return {
    name: requireString(node.items[1], "property name"),
    value: requireString(node.items[2], "property value")
  };
}

export function readSymbol(node: SList): SchematicSymbol {
  if (head(node)?.value !== "symbol") {
    throw new KicadParseError("Expected (symbol ...)", node.pos);
  }
  const libIdList = findChild(node, "lib_id");
  if (!libIdList) {
    throw new KicadParseError("(symbol ...) missing (lib_id ...)", node.pos);
  }
  const atList = findChild(node, "at");
  if (!atList) {
    throw new KicadParseError("(symbol ...) missing (at ...)", node.pos);
  }
  const uuidList = findChild(node, "uuid");
  if (!uuidList) {
    throw new KicadParseError("(symbol ...) missing (uuid ...)", node.pos);
  }
  return {
    libId: requireString(libIdList.items[1], "lib_id"),
    at: readPosition(atList),
    uuid: requireString(uuidList.items[1], "uuid"),
    properties: findChildren(node, "property").map(readProperty)
  };
}

export function readWire(node: SList): SchematicWire {
  if (head(node)?.value !== "wire") {
    throw new KicadParseError("Expected (wire ...)", node.pos);
  }
  const ptsList = findChild(node, "pts");
  if (!ptsList) {
    throw new KicadParseError("(wire ...) missing (pts ...)", node.pos);
  }
  const pts = findChildren(ptsList, "xy").map((xy) => {
    if (xy.items.length < 3) {
      throw new KicadParseError("(xy ...) needs both x and y", xy.pos);
    }
    return {
      x: readNumberAt(xy.items[1], "x in (xy ...)"),
      y: readNumberAt(xy.items[2], "y in (xy ...)")
    };
  });
  if (pts.length < 2) {
    throw new KicadParseError("(wire ...) needs at least two points", node.pos);
  }
  const uuidList = findChild(node, "uuid");
  if (uuidList) {
    return { pts, uuid: requireString(uuidList.items[1], "uuid") };
  }
  return { pts };
}

export function readSchematic(root: SList): Schematic {
  if (head(root)?.value !== "kicad_sch") {
    throw new KicadParseError("Expected (kicad_sch ...) root list", root.pos);
  }
  const versionList = findChild(root, "version");
  if (!versionList) {
    throw new KicadParseError("kicad_sch missing (version ...)", root.pos);
  }
  const generatorList = findChild(root, "generator");
  if (!generatorList) {
    throw new KicadParseError("kicad_sch missing (generator ...)", root.pos);
  }
  const uuidList = findChild(root, "uuid");
  if (!uuidList) {
    throw new KicadParseError("kicad_sch missing (uuid ...)", root.pos);
  }
  const paperList = findChild(root, "paper");
  if (!paperList) {
    throw new KicadParseError("kicad_sch missing (paper ...)", root.pos);
  }
  return {
    version: readNumberAt(versionList.items[1], "version"),
    generator: requireString(generatorList.items[1], "generator"),
    uuid: requireString(uuidList.items[1], "uuid"),
    paper: requireString(paperList.items[1], "paper"),
    symbols: findChildren(root, "symbol").map(readSymbol),
    wires: findChildren(root, "wire").map(readWire)
  };
}

// ---------- builders ----------

function positionNode(pos: SchematicPosition): SList {
  // KiCad's schematic parser requires the orientation number on every
  // (at x y angle) tuple inside a placed (symbol …). Default to 0 when
  // the caller didn't supply one.
  return list(
    atom("at"),
    atom(String(pos.x)),
    atom(String(pos.y)),
    atom(String(pos.angle ?? 0))
  );
}

function effectsNode(justify?: SchematicHierarchicalLabel["justify"]): SList {
  const effects = list(
    atom("effects"),
    list(atom("font"), list(atom("size"), atom("1.27"), atom("1.27")))
  );
  if (justify) {
    effects.items.push(keywordList("justify", atom(justify)));
  }
  return effects;
}

function propertyNode(property: SchematicSymbolProperty): SList {
  // KiCad 7+ schematic parser requires (at x y angle) and an
  // (effects (font (size …))) on every (property …) child of a placed
  // (symbol …). Callers that know the placed symbol size should provide
  // absolute property coordinates; otherwise fall back to the origin.
  const at = property.at ?? { x: 0, y: 0, angle: 0 };
  return list(
    atom("property"),
    str(property.name),
    str(property.value),
    positionNode(at),
    effectsNode()
  );
}

export function symbolNode(symbol: SchematicSymbol): SList {
  const items: SNode[] = [
    atom("symbol"),
    keywordList("lib_id", str(symbol.libId)),
    positionNode(symbol.at),
    ...(symbol.fieldsAutoplaced
      ? [keywordList("fields_autoplaced", atom("yes"))]
      : []),
    keywordList("uuid", str(symbol.uuid)),
    ...symbol.properties.map(propertyNode)
  ];
  return list(...items);
}

export function wireNode(wire: SchematicWire): SList {
  const ptsList = list(
    atom("pts"),
    ...wire.pts.map((p) =>
      keywordList("xy", atom(String(p.x)), atom(String(p.y)))
    )
  );
  if (wire.uuid !== undefined) {
    return list(atom("wire"), ptsList, keywordList("uuid", str(wire.uuid)));
  }
  return list(atom("wire"), ptsList);
}

export function hierarchicalLabelNode(
  label: SchematicHierarchicalLabel
): SList {
  return list(
    atom("hierarchical_label"),
    str(label.text),
    keywordList("shape", atom(label.shape ?? "input")),
    positionNode(label.at),
    effectsNode(label.justify),
    keywordList("uuid", str(label.uuid))
  );
}
