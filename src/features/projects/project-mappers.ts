import { catalog, findComponent, findController } from "../catalog/catalog";
import type {
  ComponentCatalogEntry,
  ControllerCatalogEntry,
  ProjectDocument,
  ProjectSummary,
  WorkspaceConnection,
  WorkspaceProject,
  WorkspaceProjectComponent
} from "../../types/domain";

function makeFallbackController(controllerId: string): ControllerCatalogEntry {
  return {
    id: controllerId,
    name: controllerId,
    packageName: "Unknown package",
    voltage: "Unknown",
    notes: "This controller is missing from the local catalog.",
    protocols: [],
    interfaces: [],
    gpioPins: []
  };
}

function makeFallbackComponent(componentId: string): ComponentCatalogEntry {
  return {
    id: componentId,
    name: componentId,
    categoryId: "unknown",
    categoryLabel: "Unknown",
    summary: "This component is missing from the local catalog.",
    voltage: "Unknown",
    packageName: "Unknown package",
    supportedProtocols: [],
    connectionOptions: []
  };
}

function buildWorkspaceComponents(project: ProjectDocument) {
  return project.components.map<WorkspaceProjectComponent>((component) => {
    const part = findComponent(component.catalogId) ?? makeFallbackComponent(component.catalogId);

    return {
      ...component,
      part,
      partName: part.name,
      supportedProtocols: part.supportedProtocols
    };
  });
}

function buildWorkspaceConnections(
  project: ProjectDocument,
  components: WorkspaceProjectComponent[]
) {
  const componentsById = new Map(components.map((component) => [component.id, component]));

  return project.connections.map<WorkspaceConnection>((connection) => {
    const component = componentsById.get(connection.componentId);

    return {
      ...connection,
      name: component?.instanceName ?? connection.componentId,
      peerPart: component?.partName ?? connection.componentId
    };
  });
}

export function resolveProjectDocument(project: ProjectDocument): WorkspaceProject {
  const controller = findController(project.controllerId) ?? makeFallbackController(project.controllerId);
  const components = buildWorkspaceComponents(project);
  const connections = buildWorkspaceConnections(project, components);

  return {
    ...project,
    controller,
    components,
    connections
  };
}

export function toProjectSummary(project: ProjectDocument): ProjectSummary {
  return {
    id: project.id,
    name: project.name,
    controller: findController(project.controllerId)?.name ?? project.controllerId,
    deviceCount: project.components.length,
    interfaceCount: project.connections.length,
    updatedAt: project.updatedAt,
    summary: project.description,
    status: project.status
  };
}

export function sortProjects(projects: ProjectDocument[]) {
  return [...projects].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

export function getInitialControllerId() {
  return catalog.controllers[0]?.id ?? "";
}
