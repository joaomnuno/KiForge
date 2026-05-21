/**
 * Loads vendored KiCad symbol bodies bundled under `catalog/symbols/`.
 *
 * Phase 1 of the symbol-vendoring plan (see
 * `docs/adr/0002-symbol-vendoring.md`). The glob ships with **zero**
 * files in this PR — vendored `.kicad_sym` files arrive in per-part
 * Phase 2 PRs. When no files are present the returned map is empty and
 * the KiCad bundle exporter falls back to today's empty-`lib_symbols`
 * behavior.
 *
 * Each `.kicad_sym` file is a `(kicad_symbol_lib ...)` wrapper that
 * may contain one or more `(symbol "Name" ...)` children. For every
 * child we derive a `libId` of the form `"<library>:<symbolName>"`
 * where `<library>` is the source filename without the `.kicad_sym`
 * extension (e.g. `"TagConnect"` for `TagConnect.kicad_sym`) and
 * `<symbolName>` is the raw quoted name inside the `(symbol "...")`
 * form. The map value is the re-serialized `(symbol ...)` body, ready
 * to be re-parsed into an `SList` and pushed into a schematic's
 * `(lib_symbols ...)` block at export time.
 */

import { findChildren, head, parse, stringify } from "../../lib/kicad";

/**
 * Bundled `.kicad_sym` sources discovered under `catalog/symbols/`.
 * Path is repo-relative from this file's location. Vite resolves the
 * glob at build time and inlines the file bodies as raw strings, so no
 * runtime filesystem read happens.
 */
const vendoredSymbolModules = import.meta.glob(
  "../../../catalog/symbols/**/*.kicad_sym",
  {
    query: "?raw",
    import: "default",
    eager: true
  }
);

function deriveLibraryName(modulePath: string): string {
  // Module paths look like `"../../../catalog/symbols/snapeda/BMP388.kicad_sym"`.
  // The library prefix is the filename without extension.
  const lastSlash = modulePath.lastIndexOf("/");
  const filename =
    lastSlash >= 0 ? modulePath.slice(lastSlash + 1) : modulePath;
  const dot = filename.lastIndexOf(".");
  return dot > 0 ? filename.slice(0, dot) : filename;
}

/**
 * Parse a single `.kicad_sym` source string and return a map of
 * `symbolName` → serialized `(symbol ...)` body. The caller combines
 * the symbol name with the source library name to form the full
 * `lib_id`. Exported separately so unit tests can exercise the parser
 * without touching the Vite glob.
 */
export function parseSymbolEntries(raw: string): Map<string, string> {
  const out = new Map<string, string>();
  const root = parse(raw);
  if (head(root)?.value !== "kicad_symbol_lib") {
    throw new Error(
      "Vendored symbol file must have a (kicad_symbol_lib ...) root"
    );
  }
  for (const symbolList of findChildren(root, "symbol")) {
    const nameNode = symbolList.items[1];
    if (!nameNode || nameNode.kind !== "string") {
      throw new Error(
        "Vendored (symbol ...) entry missing a quoted name as the first argument"
      );
    }
    out.set(nameNode.value, stringify(symbolList).trimEnd());
  }
  return out;
}

/**
 * Build the libId → symbol-body map from every vendored `.kicad_sym`
 * file bundled at build time. Keys are `"<library>:<symbolName>"`,
 * matching the `lib_id` strings the catalog references. Pure: returns
 * a fresh `Map` per call so callers can mutate without affecting other
 * consumers.
 */
export function loadVendoredSymbols(): Map<string, string> {
  const out = new Map<string, string>();
  for (const [modulePath, raw] of Object.entries(vendoredSymbolModules)) {
    if (typeof raw !== "string") {
      throw new Error(
        `Vendored symbol module at "${modulePath}" did not resolve to a raw string`
      );
    }
    const libraryName = deriveLibraryName(modulePath);
    const entries = parseSymbolEntries(raw);
    for (const [symbolName, body] of entries) {
      out.set(`${libraryName}:${symbolName}`, body);
    }
  }
  return out;
}
