import { findChildren, head, parse, type SList } from "../../lib/kicad";

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

export function parseRaw(raw: string): Map<string, SList> {
  const out = new Map<string, SList>();
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
    out.set(symbolName(symbolList), symbolList);
  }

  return out;
}

export function loadVendoredSymbols(): Map<string, SList> {
  const out = new Map<string, SList>();
  for (const raw of Object.values(vendoredSymbolModules)) {
    for (const [libId, body] of parseRaw(raw)) {
      out.set(libId, body);
    }
  }
  return out;
}
