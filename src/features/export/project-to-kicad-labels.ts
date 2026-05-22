import {
  findChild,
  head,
  toNumber,
  type SchematicHierarchicalLabel,
  type SchematicPosition,
  type SList,
  type SNode
} from "../../lib/kicad";
import type {
  ConnectionRecord,
  SignalAssignment,
  WorkspaceProject
} from "../../types/domain";
import type { ProjectKicadSymbolPlacement } from "./project-to-kicad-symbols";

interface ProjectToKicadLabelsOptions {
  vendoredSymbols: Map<string, SList>;
  uuid?: () => string;
}

interface SymbolPinPosition {
  name: string;
  at: SchematicPosition;
}

function stringArg(node: SList | null, index: number): string | null {
  const child = node?.items[index];
  return child?.kind === "string" ? child.value : null;
}

function collectLists(node: SNode, keyword: string): SList[] {
  if (node.kind !== "list") {
    return [];
  }

  const matches = head(node)?.value === keyword ? [node] : [];
  return matches.concat(
    node.items.flatMap((child) => collectLists(child, keyword))
  );
}

function readPinPosition(pin: SList): SymbolPinPosition | null {
  const name = stringArg(findChild(pin, "name"), 1);
  const at = findChild(pin, "at");
  if (!name || !at) {
    return null;
  }

  const x = toNumber(at.items[1]);
  const y = toNumber(at.items[2]);
  const angle = toNumber(at.items[3]);
  if (x === null || y === null) {
    return null;
  }

  return { name, at: { x, y, angle: angle ?? 0 } };
}

function symbolPins(symbolBody: SList): SymbolPinPosition[] {
  return collectLists(symbolBody, "pin").flatMap((pin) => {
    const position = readPinPosition(pin);
    return position ? [position] : [];
  });
}

function findPin(
  symbolBody: SList | undefined,
  pinName: string
): SymbolPinPosition | null {
  if (!symbolBody) {
    return null;
  }

  const pins = symbolPins(symbolBody);
  return (
    pins.find((pin) => pin.name === pinName) ??
    pins.find((pin) => pin.name.startsWith(`${pinName}_`)) ??
    null
  );
}

function addPosition(
  origin: SchematicPosition,
  offset: SchematicPosition
): SchematicPosition {
  const roundMm = (value: number) => Number(value.toFixed(4));
  const pinAngle = offset.angle ?? 0;
  const labelAngle = pinAngle === 180 ? 0 : pinAngle === 0 ? 180 : pinAngle;

  return {
    x: roundMm(origin.x + offset.x),
    // Symbol pin coordinates use the opposite Y axis from sheet coordinates.
    y: roundMm(origin.y - offset.y),
    angle: labelAngle
  };
}

function justifyForAngle(angle: number | undefined) {
  return angle === 180 ? "right" : "left";
}

function normalizeSignalForNet(signal: string) {
  return signal.replace("+", "P").replace("-", "M").replace(/\W+/g, "_");
}

function netName(connection: ConnectionRecord, signal: string) {
  if (connection.protocol === "UART") {
    if (signal === "TX") {
      return "UART_TXD";
    }
    if (signal === "RX") {
      return "UART_RXD";
    }
  }

  if (connection.protocol === "USB") {
    if (signal === "D+") {
      return "USB_DP";
    }
    if (signal === "D-") {
      return "USB_DM";
    }
  }

  return `${connection.controllerInterface}_${normalizeSignalForNet(signal)}`;
}

function componentPinName(
  project: WorkspaceProject,
  connection: ConnectionRecord,
  assignment: SignalAssignment
) {
  const component = project.components.find(
    (candidate) => candidate.id === connection.componentId
  );
  if (!component) {
    return assignment.signal;
  }

  if (component.part.id === "ch340k" && connection.protocol === "UART") {
    if (assignment.signal === "TX") {
      return "TXD";
    }
    if (assignment.signal === "RX") {
      return "RXD";
    }
    if (assignment.signal === "DTR") {
      return "~{DTR}";
    }
  }

  if (connection.protocol === "USB") {
    if (assignment.signal === "D+") {
      return "UD+";
    }
    if (assignment.signal === "D-") {
      return "UD-";
    }
  }

  return assignment.signal;
}

function labelForPin(
  text: string,
  symbolAt: SchematicPosition,
  pin: SymbolPinPosition,
  uuid: string
): SchematicHierarchicalLabel {
  const at = addPosition(symbolAt, pin.at);
  return {
    text,
    at,
    justify: justifyForAngle(at.angle),
    uuid
  };
}

export function projectToKicadHierarchicalLabels(
  project: WorkspaceProject,
  placements: readonly ProjectKicadSymbolPlacement[],
  options: ProjectToKicadLabelsOptions
): SchematicHierarchicalLabel[] {
  const uuid = options.uuid ?? (() => crypto.randomUUID());
  const hierarchicalLabels: SchematicHierarchicalLabel[] = [];
  const seen = new Set<string>();
  const controllerPlacement = placements.find(
    (placement) => placement.owner === "controller"
  );

  if (!controllerPlacement) {
    return hierarchicalLabels;
  }

  const controllerBody = options.vendoredSymbols.get(
    controllerPlacement.symbol.libId
  );

  function push(label: SchematicHierarchicalLabel) {
    const key = `${label.text}:${label.at.x}:${label.at.y}:${label.at.angle}`;
    if (!seen.has(key)) {
      seen.add(key);
      hierarchicalLabels.push(label);
    }
  }

  for (const connection of project.connections) {
    const componentPlacement = placements.find(
      (placement) =>
        placement.owner === "component" &&
        placement.componentId === connection.componentId
    );
    const componentBody = componentPlacement
      ? options.vendoredSymbols.get(componentPlacement.symbol.libId)
      : undefined;

    for (const assignment of connection.assignments) {
      if (!assignment.selectedPin) {
        continue;
      }

      const text = netName(connection, assignment.signal);
      const controllerPin = findPin(controllerBody, assignment.selectedPin);
      if (controllerPin) {
        push(
          labelForPin(
            text,
            controllerPlacement.symbol.at,
            controllerPin,
            uuid()
          )
        );
      }

      if (componentPlacement) {
        const componentPin = findPin(
          componentBody,
          componentPinName(project, connection, assignment)
        );
        if (componentPin) {
          push(
            labelForPin(
              text,
              componentPlacement.symbol.at,
              componentPin,
              uuid()
            )
          );
        }
      }
    }
  }

  return hierarchicalLabels;
}
