import {
  findChildren,
  head,
  parse,
  stringify,
  type SList
} from "../../lib/kicad";

/**
 * Bundled `.kicad_sym` sources discovered under `catalog/symbols/`.
 * Vite resolves the glob at build time and inlines raw strings, so no
 * runtime filesystem read happens.
 */
const vendoredSymbolModules = import.meta.glob<string>(
  "/catalog/symbols/**/*.kicad_sym",
  {
    query: "?raw",
    import: "default",
    eager: true
  }
);

function symbolName(symbolList: SList): string {
  const nameNode = symbolList.items[1];
  if (!nameNode || nameNode.kind !== "string") {
    throw new Error(
      'Vendored (symbol ...) entry must use a quoted lib_id name like "Library:Symbol"'
    );
  }
  if (!/^[^\s:]+:[^\s:]+$/.test(nameNode.value)) {
    throw new Error(
      `Vendored symbol name "${nameNode.value}" must be a lib_id like "Library:Symbol"`
    );
  }
  return nameNode.value;
}

/**
 * Parse one raw `.kicad_sym` body and return `libId` -> serialized
 * top-level `(symbol "Library:Symbol" ...)` entries.
 */
export function parseRaw(raw: string): Map<string, string> {
  const out = new Map<string, string>();
  const root = parse(raw);

  const rootHead = head(root)?.value;
  const symbolLists =
    rootHead === "symbol"
      ? [root]
      : rootHead === "kicad_symbol_lib"
        ? findChildren(root, "symbol")
        : null;

  if (!symbolLists) {
    throw new Error(
      "Vendored symbol file must have a (kicad_symbol_lib ...) or (symbol ...) root"
    );
  }

  for (const symbolList of symbolLists) {
    out.set(symbolName(symbolList), stringify(symbolList).trimEnd());
  }

  return out;
}

/**
 * Build a fresh `libId` -> symbol body map from every bundled vendored
 * `.kicad_sym` file.
 */
export function loadVendoredSymbols(): Map<string, string> {
  const out = new Map<string, string>();
  for (const raw of Object.values(vendoredSymbolModules)) {
    for (const [libId, body] of parseRaw(raw)) {
      out.set(libId, body);
    }
  }
  return out;
}
