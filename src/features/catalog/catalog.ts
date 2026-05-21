import { z } from "zod";
import {
  plannerProtocols,
  protocols,
  type ComponentCatalogEntry,
  type ComponentConnectionOption,
  type ControllerCatalogEntry,
  type LibraryCategory
} from "../../types/domain";

const protocolSchema = z.enum(protocols);
const plannerProtocolSchema = z.enum(plannerProtocols);
const signalPinSchema = z.object({
  signal: z.string().min(1),
  pins: z.array(z.string().min(1)).min(1)
});
const controllerInterfaceSchema = z.object({
  name: z.string().min(1),
  protocol: plannerProtocolSchema,
  signalPins: z.array(signalPinSchema).min(1)
});
const componentConnectionSignalSchema = z.object({
  name: z.string().min(1),
  source: z.enum(["interface", "gpio"]),
  sharedBehavior: z.enum(["reuse-on-shared", "unique"])
});
const componentConnectionOptionSchema = z.object({
  protocol: plannerProtocolSchema,
  notes: z.string().min(1),
  optionalSignals: z.array(componentConnectionSignalSchema)
});

const KICAD_LIB_ID_PATTERN = /^[^\s:]+:[^\s:]+$/;

const controllerSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  packageName: z.string().min(1),
  voltage: z.string().min(1),
  notes: z.string().min(1),
  protocols: z.array(protocolSchema).min(1),
  interfaces: z.array(controllerInterfaceSchema).min(1),
  gpioPins: z.array(z.string().min(1)).min(1),
  kicadLibId: z
    .string()
    .regex(
      KICAD_LIB_ID_PATTERN,
      'kicadLibId must be in the form "Library:Symbol"'
    )
    .optional()
});

const I2C_ADDRESS_PATTERN = /^0x[0-9a-fA-F]{2}$/;

const componentSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  categoryId: z.string().min(1),
  categoryLabel: z.string().min(1),
  summary: z.string().min(1),
  voltage: z.string().min(1),
  packageName: z.string().min(1),
  i2cAddress: z
    .string()
    .regex(I2C_ADDRESS_PATTERN, "i2cAddress must be a hex byte like 0x76")
    .optional(),
  kicadLibId: z
    .string()
    .regex(
      KICAD_LIB_ID_PATTERN,
      'kicadLibId must be in the form "Library:Symbol"'
    )
    .optional(),
  supportedProtocols: z.array(protocolSchema).min(1),
  connectionOptions: z.array(componentConnectionOptionSchema)
});

function parseCatalogModules<T extends { id: string; name: string }>(
  modules: Record<string, unknown>,
  schema: z.ZodType<T>,
  kind: string
) {
  const entries = Object.entries(modules)
    .map(([path, moduleValue]) => {
      try {
        return schema.parse(moduleValue);
      } catch (error) {
        throw new Error(
          `Invalid ${kind} catalog entry at ${path}: ${String(error)}`
        );
      }
    })
    .sort((left, right) => left.name.localeCompare(right.name));

  const seenIds = new Set<string>();
  for (const entry of entries) {
    if (seenIds.has(entry.id)) {
      throw new Error(`Duplicate ${kind} catalog id "${entry.id}"`);
    }
    seenIds.add(entry.id);
  }

  return entries;
}

const controllerModules = import.meta.glob(
  "../../../catalog/controllers/*.json",
  {
    eager: true,
    import: "default"
  }
);

const componentModules = import.meta.glob(
  "../../../catalog/components/*.json",
  {
    eager: true,
    import: "default"
  }
);

const controllers = parseCatalogModules<ControllerCatalogEntry>(
  controllerModules,
  controllerSchema,
  "controller"
);

const components = parseCatalogModules<ComponentCatalogEntry>(
  componentModules,
  componentSchema,
  "component"
);

const categories = Array.from(
  new Map(
    components.map((component) => [
      component.categoryId,
      { id: component.categoryId, label: component.categoryLabel }
    ])
  ).values()
).sort((left, right) => left.label.localeCompare(right.label));

export const catalog = {
  controllers,
  components,
  categories,
  controllersById: new Map(
    controllers.map((controller) => [controller.id, controller])
  ),
  componentsById: new Map(
    components.map((component) => [component.id, component])
  )
} as const satisfies {
  controllers: ControllerCatalogEntry[];
  components: ComponentCatalogEntry[];
  categories: LibraryCategory[];
  controllersById: Map<string, ControllerCatalogEntry>;
  componentsById: Map<string, ComponentCatalogEntry>;
};

export function findController(controllerId: string) {
  return catalog.controllersById.get(controllerId);
}

export function findComponent(componentId: string) {
  return catalog.componentsById.get(componentId);
}

export function findControllerInterface(
  controller: ControllerCatalogEntry,
  interfaceName: string
) {
  return controller.interfaces.find(
    (controllerInterface) => controllerInterface.name === interfaceName
  );
}

export function findComponentConnectionOption(
  component: ComponentCatalogEntry,
  protocol: ComponentConnectionOption["protocol"]
) {
  return component.connectionOptions.find(
    (option) => option.protocol === protocol
  );
}
