/**
 * KiCad S-expression tokenizer + parser.
 *
 * Produces a generic typed AST for any `.kicad_sch`, `.kicad_sym`,
 * `.kicad_pcb`, or `.kicad_mod` file. Semantic interpretation is
 * intentionally out of scope here — domain readers walk the AST.
 *
 * See ./README.md for scope and design notes.
 */

export interface SourcePos {
  line: number;
  column: number;
  offset: number;
}

export interface SAtom {
  kind: "atom";
  /** Raw atom text as it appeared in the source. UUIDs, keywords, numbers, etc. */
  value: string;
  pos: SourcePos;
}

export interface SString {
  kind: "string";
  /** Decoded string value (escapes resolved). */
  value: string;
  pos: SourcePos;
}

export interface SList {
  kind: "list";
  items: SNode[];
  pos: SourcePos;
}

export type SNode = SAtom | SString | SList;

export class KicadParseError extends Error {
  readonly pos: SourcePos;
  constructor(message: string, pos: SourcePos) {
    super(`${message} (line ${pos.line}, column ${pos.column})`);
    this.name = "KicadParseError";
    this.pos = pos;
  }
}

type Token =
  | { kind: "lparen"; pos: SourcePos }
  | { kind: "rparen"; pos: SourcePos }
  | { kind: "atom"; value: string; pos: SourcePos }
  | { kind: "string"; value: string; pos: SourcePos };

function tokenize(source: string): Token[] {
  const tokens: Token[] = [];
  let offset = 0;
  let line = 1;
  let column = 1;

  const peek = () => source[offset];
  const advance = () => {
    const ch = source[offset++];
    if (ch === "\n") {
      line++;
      column = 1;
    } else {
      column++;
    }
    return ch;
  };
  const here = (): SourcePos => ({ line, column, offset });

  while (offset < source.length) {
    const ch = peek();

    // Whitespace
    if (ch === " " || ch === "\t" || ch === "\r" || ch === "\n") {
      advance();
      continue;
    }

    // Parens
    if (ch === "(") {
      const pos = here();
      advance();
      tokens.push({ kind: "lparen", pos });
      continue;
    }
    if (ch === ")") {
      const pos = here();
      advance();
      tokens.push({ kind: "rparen", pos });
      continue;
    }

    // Quoted string
    if (ch === '"') {
      const startPos = here();
      advance(); // consume opening quote
      let value = "";
      while (offset < source.length) {
        const c = peek();
        if (c === '"') {
          advance(); // consume closing quote
          tokens.push({ kind: "string", value, pos: startPos });
          break;
        }
        if (c === "\\") {
          advance();
          if (offset >= source.length) {
            throw new KicadParseError(
              "Unterminated string escape at end of input",
              startPos
            );
          }
          const esc = advance();
          switch (esc) {
            case "n":
              value += "\n";
              break;
            case "t":
              value += "\t";
              break;
            case "r":
              value += "\r";
              break;
            case '"':
              value += '"';
              break;
            case "\\":
              value += "\\";
              break;
            default:
              // KiCad's escape grammar isn't formally documented; unknown
              // escapes pass through literally rather than failing hard.
              value += esc;
          }
          continue;
        }
        value += advance();
      }
      if (offset >= source.length && source[offset - 1] !== '"') {
        throw new KicadParseError("Unterminated string literal", startPos);
      }
      continue;
    }

    // Bare atom: anything up to whitespace, paren, or quote
    const startPos = here();
    let value = "";
    while (offset < source.length) {
      const c = peek();
      if (
        c === " " ||
        c === "\t" ||
        c === "\r" ||
        c === "\n" ||
        c === "(" ||
        c === ")" ||
        c === '"'
      ) {
        break;
      }
      value += advance();
    }
    if (value.length === 0) {
      throw new KicadParseError(`Unexpected character: ${ch}`, startPos);
    }
    tokens.push({ kind: "atom", value, pos: startPos });
  }

  return tokens;
}

export function parse(source: string): SList {
  const tokens = tokenize(source);
  let index = 0;

  const peek = () => tokens[index];
  const consume = () => tokens[index++];

  function parseNode(): SNode {
    const tok = peek();
    if (!tok) {
      const lastPos = tokens[tokens.length - 1]?.pos ?? {
        line: 1,
        column: 1,
        offset: 0
      };
      throw new KicadParseError("Unexpected end of input", lastPos);
    }
    if (tok.kind === "lparen") {
      consume();
      const items: SNode[] = [];
      while (true) {
        const next = peek();
        if (!next) {
          throw new KicadParseError("Unterminated list", tok.pos);
        }
        if (next.kind === "rparen") {
          consume();
          return { kind: "list", items, pos: tok.pos };
        }
        items.push(parseNode());
      }
    }
    if (tok.kind === "rparen") {
      throw new KicadParseError("Unexpected closing paren", tok.pos);
    }
    if (tok.kind === "string") {
      consume();
      return { kind: "string", value: tok.value, pos: tok.pos };
    }
    consume();
    return { kind: "atom", value: tok.value, pos: tok.pos };
  }

  const root = parseNode();
  if (root.kind !== "list") {
    throw new KicadParseError(
      "Top-level S-expression must be a list",
      root.pos
    );
  }
  const trailing = peek();
  if (trailing) {
    throw new KicadParseError(
      "Unexpected content after top-level list",
      trailing.pos
    );
  }
  return root;
}

// ---------- AST helpers ----------

/** Numeric coercion that returns `null` instead of `NaN` for non-numbers. */
export function toNumber(node: SNode): number | null {
  if (node.kind !== "atom") return null;
  if (node.value.length === 0) return null;
  const n = Number(node.value);
  return Number.isFinite(n) ? n : null;
}

/** First element of a list cast as an atom, or `null`. Useful for keyword dispatch. */
export function head(list: SList): SAtom | null {
  const first = list.items[0];
  return first && first.kind === "atom" ? first : null;
}

/** Returns true if `list` starts with the atom `keyword`. */
export function isList(node: SNode, keyword: string): node is SList {
  return node.kind === "list" && head(node)?.value === keyword;
}

/** First child list whose head atom is `keyword`. */
export function findChild(list: SList, keyword: string): SList | null {
  for (const item of list.items) {
    if (isList(item, keyword)) return item;
  }
  return null;
}

/** Every child list whose head atom is `keyword`. */
export function findChildren(list: SList, keyword: string): SList[] {
  const out: SList[] = [];
  for (const item of list.items) {
    if (isList(item, keyword)) out.push(item);
  }
  return out;
}
