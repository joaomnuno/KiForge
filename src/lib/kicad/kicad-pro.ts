/**
 * Typed reader for `.kicad_pro` (JSON since KiCad 6.0).
 *
 * The schema is broad and changes between KiCad minor versions. We only
 * type the top-level shape KiForge needs to identify a project file
 * (mainly: this is a project, what's its schema version, what's its
 * filename hint). The rest is kept as opaque pass-through so callers
 * can read raw keys later without breaking on unknown fields.
 */

export interface KicadProMeta {
  /** Project schema version. KiCad 6.0 introduced version 1. */
  version: number;
  /** Source filename hint written by KiCad. Optional. */
  filename?: string;
}

export interface KicadProDocument {
  meta: KicadProMeta;
  /** Pass-through for the rest of the document. */
  raw: Record<string, unknown>;
}

export class KicadProParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "KicadProParseError";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function parseKicadPro(source: string): KicadProDocument {
  let raw: unknown;
  try {
    raw = JSON.parse(source);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new KicadProParseError(`.kicad_pro is not valid JSON: ${detail}`);
  }
  if (!isRecord(raw)) {
    throw new KicadProParseError(
      ".kicad_pro must be a JSON object at the top level"
    );
  }
  const meta = raw.meta;
  if (!isRecord(meta)) {
    throw new KicadProParseError(
      '.kicad_pro is missing the required "meta" object'
    );
  }
  const version = meta.version;
  if (typeof version !== "number" || !Number.isFinite(version)) {
    throw new KicadProParseError(
      '.kicad_pro "meta.version" must be a finite number'
    );
  }
  const filename = meta.filename;
  if (filename !== undefined && typeof filename !== "string") {
    throw new KicadProParseError(
      '.kicad_pro "meta.filename" must be a string when present'
    );
  }
  return {
    meta: { version, ...(filename !== undefined ? { filename } : {}) },
    raw
  };
}
