/**
 * Serializer for KiCad S-expression AST.
 *
 * Output shape matches the formatting KiCad's own writer produces:
 * - leaf-only lists are emitted single-line: `(version 20231120)`
 * - lists containing a nested list are emitted multi-line with the
 *   head atom on the opening-paren line and children tab-indented:
 *
 *       (kicad_sch
 *       \t(version 20231120)
 *       \t(generator "kiforge")
 *       )
 *
 * Indentation is tabs because that's what KiCad writes; it keeps PR
 * diffs against KiCad-generated files clean.
 */

import type { SList, SNode } from "./sexpr";

function escapeString(value: string): string {
  let out = "";
  for (const ch of value) {
    switch (ch) {
      case "\\":
        out += "\\\\";
        break;
      case '"':
        out += '\\"';
        break;
      case "\n":
        out += "\\n";
        break;
      case "\r":
        out += "\\r";
        break;
      case "\t":
        out += "\\t";
        break;
      default:
        out += ch;
    }
  }
  return out;
}

function isMultiline(list: SList): boolean {
  return list.items.some((item) => item.kind === "list");
}

function stringifyNode(node: SNode, indent: number): string {
  if (node.kind === "atom") {
    return node.value;
  }
  if (node.kind === "string") {
    return `"${escapeString(node.value)}"`;
  }
  if (!isMultiline(node)) {
    const inner = node.items.map((i) => stringifyNode(i, indent)).join(" ");
    return `(${inner})`;
  }
  const childPad = "\t".repeat(indent + 1);
  const closePad = "\t".repeat(indent);
  const head = node.items[0];
  if (head && head.kind === "atom") {
    const headStr = stringifyNode(head, indent);
    const restLines = node.items
      .slice(1)
      .map((item) => childPad + stringifyNode(item, indent + 1))
      .join("\n");
    if (restLines.length === 0) {
      return `(${headStr})`;
    }
    return `(${headStr}\n${restLines}\n${closePad})`;
  }
  const lines = node.items
    .map((item) => childPad + stringifyNode(item, indent + 1))
    .join("\n");
  return `(\n${lines}\n${closePad})`;
}

export function stringify(root: SList): string {
  return stringifyNode(root, 0) + "\n";
}
