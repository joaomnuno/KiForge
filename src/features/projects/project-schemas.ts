import { z } from "zod";
import {
  busModes,
  componentStatuses,
  connectionStatuses,
  issueSeverities,
  outputTargets,
  projectStatuses,
  protocols,
  signalAssignmentStatuses,
  voltageDomains
} from "../../types/domain";

export const createProjectInputSchema = z.object({
  name: z.string().trim().min(3, "Use at least 3 characters."),
  description: z.string().trim().min(8, "Add a short context note."),
  controllerId: z.string().min(1, "Choose a target controller."),
  template: z.string().trim().min(1),
  voltageDomain: z.enum(voltageDomains),
  outputTarget: z.enum(outputTargets)
});

export const projectDocumentSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().min(1),
  controllerId: z.string().min(1),
  status: z.enum(projectStatuses),
  voltageDomain: z.enum(voltageDomains),
  template: z.string().min(1),
  outputTarget: z.enum(outputTargets),
  components: z.array(
    z.object({
      id: z.string().min(1),
      catalogId: z.string().min(1),
      instanceName: z.string().min(1),
      status: z.enum(componentStatuses),
      preferredProtocol: z.enum(protocols).optional()
    })
  ),
  connections: z.array(
    z.object({
      id: z.string().min(1),
      componentId: z.string().min(1),
      protocol: z.enum(protocols),
      controllerInterface: z.string().min(1),
      pins: z.array(z.string().min(1)),
      busMode: z.enum(busModes),
      optionalSignals: z.array(z.string()),
      status: z.enum(connectionStatuses),
      assignments: z.array(
        z.object({
          signal: z.string().min(1),
          selectedPin: z.string(),
          alternatePins: z.array(z.string()),
          status: z.enum(signalAssignmentStatuses)
        })
      )
    })
  ),
  issues: z.array(
    z.object({
      id: z.string().min(1),
      severity: z.enum(issueSeverities),
      message: z.string().min(1)
    })
  ),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1)
});
