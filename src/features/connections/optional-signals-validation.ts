/**
 * Missing-optional-signals check.
 *
 * Roadmap P1: "Missing optional-but-recommended signals (reset on
 * flash, INT on IMU, etc.) flagged at warning severity."
 *
 * For each saved connection, looks up the catalog entry's declared
 * optional signals for that protocol and emits one `info`-level issue
 * per signal the user did not enable. Info-level is intentional: these
 * are recommendations, not blocking errors. The connection still
 * functions without them.
 *
 * Components without a catalog connectionOption for their saved
 * protocol are silently skipped (the planner already flags those via
 * the unconnected / unresolved paths in applyDerivedProjectState).
 */

import { findComponentConnectionOption } from "../catalog/catalog";
import type {
  PlannerProtocol,
  ValidationIssue,
  WorkspaceProject
} from "../../types/domain";

const PLANNER_PROTOCOLS = ["SPI", "I2C", "UART", "USB", "SWD"] as const;

function isPlannerProtocol(value: string): value is PlannerProtocol {
  return (PLANNER_PROTOCOLS as readonly string[]).includes(value);
}

export function validateOptionalSignalsCoverage(
  project: WorkspaceProject
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  for (const connection of project.connections) {
    const protocol = connection.protocol;
    if (!isPlannerProtocol(protocol)) {
      continue;
    }
    const component = project.components.find(
      (c) => c.id === connection.componentId
    );
    if (!component) {
      continue;
    }
    const option = findComponentConnectionOption(component.part, protocol);
    if (!option || option.optionalSignals.length === 0) {
      continue;
    }

    // connection.optionalSignals stores display strings like
    // "HOLD -> PB0" or "HOLD not assigned" (see
    // buildConnectionRecordFromDraft). The bare signal name is the
    // first whitespace-separated token.
    const enabled = new Set(
      connection.optionalSignals.map((entry) => entry.split(/\s+/)[0])
    );
    for (const optional of option.optionalSignals) {
      if (enabled.has(optional.name)) {
        continue;
      }
      issues.push({
        id: `${connection.id}-optional-${optional.name}-missing`,
        severity: "info",
        message: `${component.instanceName} (${component.part.name}) could connect the optional ${protocol} signal "${optional.name}" — leave it out only if the design doesn't need it.`
      });
    }
  }

  return issues;
}
