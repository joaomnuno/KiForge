/**
 * I2C address conflict check.
 *
 * Roadmap P1 second validation rule. For every I2C bus in the project,
 * group connected components by their catalog `i2cAddress` and flag any
 * address shared by two or more components on the same controller
 * interface (= same physical I2C bus).
 *
 * Components without an `i2cAddress` are skipped (their address is
 * either unknown or configurable at runtime — the planner can't tell).
 * Components on different I2C interfaces never conflict with each
 * other because they sit on physically separate buses.
 */

import type { ValidationIssue, WorkspaceProject } from "../../types/domain";

/** Normalize an address string for comparison: lowercase hex. */
function normalizeAddress(address: string): string {
  return address.toLowerCase();
}

export function validateI2cAddressConflicts(
  project: WorkspaceProject
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  // Group I2C connections by controller interface (== physical bus).
  const busGroups = new Map<
    string,
    Array<{
      componentId: string;
      instanceName: string;
      partName: string;
      address: string;
    }>
  >();

  for (const connection of project.connections) {
    if (connection.protocol !== "I2C") continue;
    const component = project.components.find(
      (c) => c.id === connection.componentId
    );
    if (!component) continue;
    const address = component.part.i2cAddress;
    if (!address) continue;
    const busKey = connection.controllerInterface;
    if (!busGroups.has(busKey)) {
      busGroups.set(busKey, []);
    }
    busGroups.get(busKey)!.push({
      componentId: component.id,
      instanceName: component.instanceName,
      partName: component.part.name,
      address: normalizeAddress(address)
    });
  }

  for (const [busKey, members] of busGroups) {
    const byAddress = new Map<string, typeof members>();
    for (const member of members) {
      if (!byAddress.has(member.address)) {
        byAddress.set(member.address, []);
      }
      byAddress.get(member.address)!.push(member);
    }
    for (const [address, colliders] of byAddress) {
      if (colliders.length < 2) continue;
      const sortedById = [...colliders].sort((a, b) =>
        a.componentId.localeCompare(b.componentId)
      );
      const summary = sortedById
        .map((m) => `${m.instanceName} (${m.partName})`)
        .join(", ");
      for (const member of sortedById) {
        issues.push({
          id: `${member.componentId}-i2c-address-conflict-${busKey}`,
          severity: "error",
          message: `I2C address ${address} on ${busKey} is used by multiple devices: ${summary}.`
        });
      }
    }
  }

  return issues;
}
