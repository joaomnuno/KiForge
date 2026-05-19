import { create } from "zustand";
import { applyDerivedProjectState } from "../connections/planner";
import { findComponent } from "../catalog/catalog";
import type {
  ConnectionRecord,
  CreateProjectInput,
  ProjectDocument,
  ProjectExportResult,
  ProjectSummary,
  WorkspaceProject
} from "../../types/domain";
import {
  resolveProjectDocument,
  sortProjects,
  toProjectSummary
} from "./project-mappers";
import { getProjectService } from "./project-service";

const ACTIVE_PROJECT_STORAGE_KEY = "kiforge.active-project-id.v1";

interface WorkspaceSnapshot {
  projects: ProjectSummary[];
  activeProjectId: string | null;
  currentProjectDocument: ProjectDocument | null;
  currentProject: WorkspaceProject | null;
}

interface WorkspaceState extends WorkspaceSnapshot {
  isInitialized: boolean;
  isLoading: boolean;
  isSaving: boolean;
  isExporting: boolean;
  errorMessage: string | null;
  exportResult: ProjectExportResult | null;
  initialize: () => Promise<void>;
  openProject: (projectId: string) => Promise<void>;
  createProject: (
    input: CreateProjectInput
  ) => Promise<WorkspaceProject | null>;
  saveCurrentProject: () => Promise<void>;
  renameProject: (projectId: string, name: string) => Promise<void>;
  duplicateProject: (
    projectId: string,
    name?: string
  ) => Promise<WorkspaceProject | null>;
  deleteProject: (projectId: string) => Promise<void>;
  exportProject: (projectId: string) => Promise<ProjectExportResult | null>;
  addComponentToCurrentProject: (catalogId: string) => Promise<void>;
  removeComponentFromCurrentProject: (
    projectComponentId: string
  ) => Promise<void>;
  renameComponentInCurrentProject: (
    projectComponentId: string,
    instanceName: string
  ) => Promise<void>;
  saveConnectionToCurrentProject: (
    connection: ConnectionRecord
  ) => Promise<void>;
  deleteConnectionFromCurrentProject: (connectionId: string) => Promise<void>;
  clearError: () => void;
}

function slugify(value: string) {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  return slug || "item";
}

function toErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "An unexpected persistence error occurred.";
}

function makeProjectExportFileName(projectId: string) {
  return `${projectId}-project.json`;
}

function isDownloadTarget(target: string) {
  return target.startsWith("data:") || target.startsWith("blob:");
}

function buildProjectExportResult(
  projectId: string,
  target: string,
  projects: ProjectSummary[]
): ProjectExportResult {
  const projectName =
    projects.find((project) => project.id === projectId)?.name ?? projectId;
  const fileName = makeProjectExportFileName(projectId);
  const kind = isDownloadTarget(target) ? "download-url" : "file-path";
  const message =
    kind === "download-url"
      ? `Browser preview export prepared for "${projectName}". Use the download link to save ${fileName}.`
      : `Exported "${projectName}" to ${target}.`;

  return {
    projectId,
    projectName,
    fileName,
    target,
    kind,
    message,
    exportedAt: new Date().toISOString()
  };
}

function getStorage() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage;
}

function readActiveProjectId() {
  return getStorage()?.getItem(ACTIVE_PROJECT_STORAGE_KEY) ?? null;
}

function writeActiveProjectId(projectId: string | null) {
  const storage = getStorage();
  if (!storage) {
    return;
  }

  if (projectId) {
    storage.setItem(ACTIVE_PROJECT_STORAGE_KEY, projectId);
    return;
  }

  storage.removeItem(ACTIVE_PROJECT_STORAGE_KEY);
}

function buildWorkspaceSnapshot(
  projectDocuments: ProjectDocument[],
  preferredProjectId?: string | null
): WorkspaceSnapshot {
  const sortedProjects = sortProjects(
    projectDocuments.map(applyDerivedProjectState)
  );
  const requestedProjectId = preferredProjectId ?? readActiveProjectId();
  const resolvedActiveProjectId =
    requestedProjectId &&
    sortedProjects.some((project) => project.id === requestedProjectId)
      ? requestedProjectId
      : (sortedProjects[0]?.id ?? null);

  const currentProjectDocument =
    sortedProjects.find((project) => project.id === resolvedActiveProjectId) ??
    null;

  writeActiveProjectId(resolvedActiveProjectId);

  return {
    projects: sortedProjects.map(toProjectSummary),
    activeProjectId: resolvedActiveProjectId,
    currentProjectDocument,
    currentProject: currentProjectDocument
      ? resolveProjectDocument(currentProjectDocument)
      : null
  };
}

function makeUniqueItemId(existingIds: string[], seed: string) {
  const baseId = slugify(seed);
  let candidateId = baseId;
  let duplicateIndex = 2;

  while (existingIds.includes(candidateId)) {
    candidateId = `${baseId}-${duplicateIndex}`;
    duplicateIndex += 1;
  }

  return candidateId;
}

function makeUniqueInstanceName(existingNames: string[], seed: string) {
  if (!existingNames.includes(seed)) {
    return seed;
  }

  let duplicateIndex = 2;
  let candidateName = `${seed} ${duplicateIndex}`;

  while (existingNames.includes(candidateName)) {
    duplicateIndex += 1;
    candidateName = `${seed} ${duplicateIndex}`;
  }

  return candidateName;
}

async function refreshWorkspace(
  setState: (partial: Partial<WorkspaceState>) => void,
  preferredProjectId?: string | null
) {
  const projectDocuments = await getProjectService().loadProjects();
  const snapshot = buildWorkspaceSnapshot(projectDocuments, preferredProjectId);

  setState({
    ...snapshot,
    isInitialized: true,
    isLoading: false,
    isSaving: false,
    exportResult: null,
    errorMessage: null
  });

  return snapshot.currentProject;
}

async function persistProjectDocument(
  setState: (partial: Partial<WorkspaceState>) => void,
  project: ProjectDocument
) {
  const savedProject = await getProjectService().saveProject(
    applyDerivedProjectState(project)
  );
  return refreshWorkspace(setState, savedProject.id);
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  projects: [],
  activeProjectId: null,
  currentProjectDocument: null,
  currentProject: null,
  isInitialized: false,
  isLoading: false,
  isSaving: false,
  isExporting: false,
  errorMessage: null,
  exportResult: null,

  async initialize() {
    if (get().isLoading) {
      return;
    }

    set({ isLoading: true, errorMessage: null });

    try {
      await refreshWorkspace(set);
    } catch (error) {
      set({
        isInitialized: true,
        isLoading: false,
        errorMessage: toErrorMessage(error)
      });
    }
  },

  async openProject(projectId) {
    set({ isLoading: true, errorMessage: null });

    try {
      await refreshWorkspace(set, projectId);
    } catch (error) {
      set({
        isLoading: false,
        errorMessage: toErrorMessage(error)
      });
    }
  },

  async createProject(input) {
    set({ isSaving: true, errorMessage: null });

    try {
      const project = await getProjectService().createProject(input);
      return await refreshWorkspace(set, project.id);
    } catch (error) {
      set({
        isSaving: false,
        errorMessage: toErrorMessage(error)
      });
      return null;
    }
  },

  async saveCurrentProject() {
    const currentProjectDocument = get().currentProjectDocument;
    if (!currentProjectDocument) {
      return;
    }

    set({ isSaving: true, errorMessage: null });

    try {
      await persistProjectDocument(set, currentProjectDocument);
    } catch (error) {
      set({
        isSaving: false,
        errorMessage: toErrorMessage(error)
      });
    }
  },

  async renameProject(projectId, name) {
    const trimmedName = name.trim();
    if (!trimmedName) {
      return;
    }

    set({ isSaving: true, errorMessage: null });

    try {
      const project = await getProjectService().renameProject(
        projectId,
        trimmedName
      );
      await refreshWorkspace(set, project.id);
    } catch (error) {
      set({
        isSaving: false,
        errorMessage: toErrorMessage(error)
      });
    }
  },

  async duplicateProject(projectId, name) {
    set({ isSaving: true, errorMessage: null });

    try {
      const project = await getProjectService().duplicateProject(
        projectId,
        name
      );
      return await refreshWorkspace(set, project.id);
    } catch (error) {
      set({
        isSaving: false,
        errorMessage: toErrorMessage(error)
      });
      return null;
    }
  },

  async deleteProject(projectId) {
    set({ isSaving: true, errorMessage: null });

    try {
      await getProjectService().deleteProject(projectId);
      const preferredProjectId =
        get().activeProjectId === projectId ? null : get().activeProjectId;
      await refreshWorkspace(set, preferredProjectId);
    } catch (error) {
      set({
        isSaving: false,
        errorMessage: toErrorMessage(error)
      });
    }
  },

  async exportProject(projectId) {
    if (get().isExporting) {
      return null;
    }

    set({ isExporting: true, errorMessage: null, exportResult: null });

    try {
      const target = await getProjectService().exportProject(projectId);
      const exportResult = buildProjectExportResult(
        projectId,
        target,
        get().projects
      );

      set({
        isExporting: false,
        exportResult,
        errorMessage: null
      });

      return exportResult;
    } catch (error) {
      set({
        isExporting: false,
        exportResult: null,
        errorMessage: toErrorMessage(error)
      });
      return null;
    }
  },

  async addComponentToCurrentProject(catalogId) {
    const currentProjectDocument = get().currentProjectDocument;
    if (!currentProjectDocument) {
      return;
    }

    const component = findComponent(catalogId);
    if (!component) {
      set({
        errorMessage: `Component "${catalogId}" was not found in the catalog.`
      });
      return;
    }

    const nextComponent = {
      id: makeUniqueItemId(
        currentProjectDocument.components.map((candidate) => candidate.id),
        component.id
      ),
      catalogId: component.id,
      instanceName: makeUniqueInstanceName(
        currentProjectDocument.components.map(
          (candidate) => candidate.instanceName
        ),
        component.name
      ),
      status: "Unconnected" as const,
      preferredProtocol: component.supportedProtocols[0]
    };

    set({ isSaving: true, errorMessage: null });

    try {
      await persistProjectDocument(set, {
        ...currentProjectDocument,
        components: [...currentProjectDocument.components, nextComponent]
      });
    } catch (error) {
      set({
        isSaving: false,
        errorMessage: toErrorMessage(error)
      });
    }
  },

  async removeComponentFromCurrentProject(projectComponentId) {
    const currentProjectDocument = get().currentProjectDocument;
    if (!currentProjectDocument) {
      return;
    }

    set({ isSaving: true, errorMessage: null });

    try {
      await persistProjectDocument(set, {
        ...currentProjectDocument,
        components: currentProjectDocument.components.filter(
          (candidate) => candidate.id !== projectComponentId
        ),
        connections: currentProjectDocument.connections.filter(
          (connection) => connection.componentId !== projectComponentId
        )
      });
    } catch (error) {
      set({
        isSaving: false,
        errorMessage: toErrorMessage(error)
      });
    }
  },

  async renameComponentInCurrentProject(projectComponentId, instanceName) {
    const trimmedName = instanceName.trim();
    if (!trimmedName) {
      return;
    }

    const currentProjectDocument = get().currentProjectDocument;
    if (!currentProjectDocument) {
      return;
    }

    set({ isSaving: true, errorMessage: null });

    try {
      await persistProjectDocument(set, {
        ...currentProjectDocument,
        components: currentProjectDocument.components.map((candidate) =>
          candidate.id === projectComponentId
            ? { ...candidate, instanceName: trimmedName }
            : candidate
        )
      });
    } catch (error) {
      set({
        isSaving: false,
        errorMessage: toErrorMessage(error)
      });
    }
  },

  async saveConnectionToCurrentProject(connection) {
    const currentProjectDocument = get().currentProjectDocument;
    if (!currentProjectDocument) {
      return;
    }

    const nextConnections = currentProjectDocument.connections.some(
      (candidate) => candidate.id === connection.id
    )
      ? currentProjectDocument.connections.map((candidate) =>
          candidate.id === connection.id ? connection : candidate
        )
      : [...currentProjectDocument.connections, connection];

    set({ isSaving: true, errorMessage: null });

    try {
      await persistProjectDocument(set, {
        ...currentProjectDocument,
        connections: nextConnections
      });
    } catch (error) {
      set({
        isSaving: false,
        errorMessage: toErrorMessage(error)
      });
    }
  },

  async deleteConnectionFromCurrentProject(connectionId) {
    const currentProjectDocument = get().currentProjectDocument;
    if (!currentProjectDocument) {
      return;
    }

    set({ isSaving: true, errorMessage: null });

    try {
      await persistProjectDocument(set, {
        ...currentProjectDocument,
        connections: currentProjectDocument.connections.filter(
          (connection) => connection.id !== connectionId
        )
      });
    } catch (error) {
      set({
        isSaving: false,
        errorMessage: toErrorMessage(error)
      });
    }
  },

  clearError() {
    set({ errorMessage: null });
  }
}));
