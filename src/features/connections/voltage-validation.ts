/**
 * Voltage-domain compatibility check.
 *
 * Roadmap P1 first validation rule: warn when a project component's
 * supply range does not include the project's chosen voltage domain.
 *
 * Pure function with its own small voltage-string parser so the
 * connection planner can opt in (or other callers) without dragging in
 * planner internals. Wiring into `applyDerivedProjectState` is a
 * separate slice.
 */

import type {
  ValidationIssue,
  VoltageDomain,
  WorkspaceProject
} from "../../types/domain";

export interface VoltageRange {
  /** Minimum supported supply voltage in volts. */
  min: number;
  /** Maximum supported supply voltage in volts. */
  max: number;
}

const VOLTAGE_NUMBER = /(\d+(?:\.\d+)?)\s*V/gi;

/**
 * Parse a free-form catalog voltage string into a min/max range.
 *
 * Observed catalog conventions:
 *
 *   "3.3V"              -> { min: 3.3, max: 3.3 }
 *   "3.3V logic"        -> { min: 3.3, max: 3.3 }
 *   "1.65V - 3.6V"      -> { min: 1.65, max: 3.6 }
 *   "1.71V - 3.6V"      -> { min: 1.71, max: 3.6 }
 *   "3.3V / 5V"         -> { min: 3.3, max: 5 }
 *   "Board logic"       -> null   (no parseable number)
 *   ""                  -> null
 *
 * Returns `null` for strings without a parseable voltage number; the
 * caller should treat that as "unknown range" and skip warnings.
 */
export function parseVoltageRange(value: string): VoltageRange | null {
  const matches = Array.from(value.matchAll(VOLTAGE_NUMBER));
  if (matches.length === 0) {
    return null;
  }
  const numbers = matches
    .map((match) => Number(match[1]))
    .filter((n) => Number.isFinite(n));
  if (numbers.length === 0) {
    return null;
  }
  return { min: Math.min(...numbers), max: Math.max(...numbers) };
}

const DOMAIN_TARGET_VOLTS: Partial<Record<VoltageDomain, number>> = {
  "3.3V": 3.3,
  "5V": 5
};

/**
 * Returns a `warning` `ValidationIssue` for every project component
 * whose parsed voltage range does not include the project's voltage
 * domain. Returns `[]` if the project domain is `Mixed` / `Undecided`
 * (intentional ambiguity) or every component's voltage string is
 * unparseable.
 */
export function validateVoltageCompatibility(
  project: WorkspaceProject
): ValidationIssue[] {
  const target = DOMAIN_TARGET_VOLTS[project.voltageDomain];
  if (target === undefined) {
    return [];
  }
  const issues: ValidationIssue[] = [];
  for (const component of project.components) {
    const range = parseVoltageRange(component.part.voltage);
    if (!range) {
      continue;
    }
    if (target < range.min || target > range.max) {
      issues.push({
        id: `${component.id}-voltage-mismatch`,
        severity: "warning",
        message: `${component.instanceName} (${component.part.name}) supports ${range.min}V–${range.max}V; project domain is ${project.voltageDomain}.`
      });
    }
  }
  return issues;
}
