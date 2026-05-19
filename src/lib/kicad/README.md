# KiCad file format support

First slice of the KiCad import/export path used by the project-bundle
exporter (see roadmap P0: "real export action inside the project shell").

## Scope (this slice)

- `sexpr.ts` — tokenizer + recursive-descent parser for KiCad's
  S-expression dialect (`.kicad_sch`, `.kicad_sym`, `.kicad_pcb`,
  `.kicad_mod`). Produces a typed AST with source positions.
- `kicad-pro.ts` — typed reader for `.kicad_pro` (JSON since KiCad 6.0).
  Validates the minimum top-level shape KiForge needs to identify a
  project file; rest is pass-through.

The AST is read-only data. A serializer (writer) is intentionally **not**
included yet — first ship parse + tests so we can build the exporter on
top with confidence the round-trip data model is right.

## Out of scope (deferred)

- Domain interpretation of `.kicad_sch` content (lib_symbols, symbols,
  wires, junctions, labels). The current parser stops at the generic
  AST; semantic walkers land when the exporter slice starts.
- `.kicad_pcb`, `.kicad_mod`, `.kicad_sym` semantic types. Same tokenizer
  works on all of them — semantic layers are added per format on demand.
- Legacy formats (`.sch`, `.lib`, `.net`). KiCad 5 and earlier; not
  produced by KiCad 6+, not in the roadmap.
- Writing/serializing back to disk. Comes with the exporter PR.
- Rust port. Stays TypeScript until profiling shows a bottleneck — the
  Tauri command surface can call into TS-produced bytes just as well.

## Design notes

- **No external deps.** Tokenizer is ~120 lines; parser is recursive.
- **Atoms vs strings.** The AST distinguishes quoted strings (with
  escape decoding) from bare atoms (numbers, keywords, UUIDs). Numeric
  coercion is on-demand via `toNumber()`; we don't classify at tokenize
  time because UUIDs like `00000000-0000-...` lex as atoms and false-
  positives on `parseFloat` would corrupt them.
- **Source positions** are kept on every node so error messages can point
  at line/column.
- **String escapes** handled: `\\`, `\"`, `\n`, `\t`, `\r`. KiCad's
  official S-expression spec is thin on escape rules, but real KiCad
  output uses these — verified against fixtures from KiCad 7.

## References

- [KiCad file formats index](https://dev-docs.kicad.org/en/file-formats/)
- [S-expression intro](https://dev-docs.kicad.org/en/file-formats/sexpr-intro/)
- [Schematic format](https://dev-docs.kicad.org/en/file-formats/sexpr-schematic/)
