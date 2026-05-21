import { isTauriRuntime } from "../../lib/runtime";
import type { CreateProjectInput, ProjectDocument } from "../../types/domain";
import { projectDocumentSchema } from "./project-schemas";

const PROJECT_STORAGE_KEY = "kiforge.projects.v1";

export interface ProjectService {
  loadProjects: () => Promise<ProjectDocument[]>;
  createProject: (input: CreateProjectInput) => Promise<ProjectDocument>;
  loadProject: (projectId: string) => Promise<ProjectDocument>;
  saveProject: (project: ProjectDocument) => Promise<ProjectDocument>;
  renameProject: (projectId: string, name: string) => Promise<ProjectDocument>;
  duplicateProject: (
    projectId: string,
    name?: string
  ) => Promise<ProjectDocument>;
  deleteProject: (projectId: string) => Promise<void>;
  exportProject: (projectId: string) => Promise<string>;
  /**
   * Write a KiCad starter bundle (filename → contents map) into the
   * project's `kicad/` subdirectory. Returns the absolute path of that
   * directory. Desktop-only; the browser fallback rejects.
   */
  writeKicadBundle: (
    projectId: string,
    files: Record<string, string>
  ) => Promise<string>;
}

function slugify(value: string) {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  return slug || "project";
}

function getTimestamp() {
  return new Date().toISOString();
}

function getStorage() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage;
}

function parseProjects(payload: unknown) {
  return projectDocumentSchema.array().parse(payload);
}

function readBrowserProjects() {
  const storage = getStorage();
  if (!storage) {
    return [];
  }

  const rawProjects = storage.getItem(PROJECT_STORAGE_KEY);
  if (!rawProjects) {
    return [];
  }

  return parseProjects(JSON.parse(rawProjects));
}

function writeBrowserProjects(projects: ProjectDocument[]) {
  const storage = getStorage();
  if (!storage) {
    return;
  }

  storage.setItem(PROJECT_STORAGE_KEY, JSON.stringify(projects));
}

function makeProjectDataUrl(project: ProjectDocument) {
  const serializedProject = JSON.stringify(project, null, 2);
  return `data:application/json;charset=utf-8,${encodeURIComponent(serializedProject)}`;
}

function makeUniqueProjectId(existingIds: string[], name: string) {
  const baseId = slugify(name);
  let candidateId = baseId;
  let duplicateIndex = 2;

  while (existingIds.includes(candidateId)) {
    candidateId = `${baseId}-${duplicateIndex}`;
    duplicateIndex += 1;
  }

  return candidateId;
}

const browserProjectService: ProjectService = {
  async loadProjects() {
    return readBrowserProjects().sort((left, right) =>
      right.updatedAt.localeCompare(left.updatedAt)
    );
  },

  async createProject(input) {
    const projects = readBrowserProjects();
    const timestamp = getTimestamp();
    const project: ProjectDocument = {
      id: makeUniqueProjectId(
        projects.map((candidate) => candidate.id),
        input.name
      ),
      name: input.name.trim(),
      description: input.description.trim(),
      controllerId: input.controllerId,
      status: "Draft",
      voltageDomain: input.voltageDomain,
      template: input.template.trim(),
      outputTarget: input.outputTarget,
      components: [],
      connections: [],
      issues: [],
      createdAt: timestamp,
      updatedAt: timestamp
    };

    writeBrowserProjects([project, ...projects]);
    return project;
  },

  async loadProject(projectId) {
    const project = readBrowserProjects().find(
      (candidate) => candidate.id === projectId
    );
    if (!project) {
      throw new Error(`Project "${projectId}" was not found.`);
    }

    return project;
  },

  async saveProject(project) {
    const projects = readBrowserProjects();
    const nextProject = {
      ...project,
      name: project.name.trim(),
      description: project.description.trim(),
      template: project.template.trim(),
      updatedAt: getTimestamp()
    };

    const nextProjects = projects.some(
      (candidate) => candidate.id === project.id
    )
      ? projects.map((candidate) =>
          candidate.id === project.id ? nextProject : candidate
        )
      : [nextProject, ...projects];

    writeBrowserProjects(nextProjects);
    return nextProject;
  },

  async renameProject(projectId, name) {
    const project = await browserProjectService.loadProject(projectId);
    return browserProjectService.saveProject({
      ...project,
      name: name.trim()
    });
  },

  async duplicateProject(projectId, name) {
    const sourceProject = await browserProjectService.loadProject(projectId);
    const projects = readBrowserProjects();
    const duplicateName = name?.trim() || `${sourceProject.name} Copy`;
    const timestamp = getTimestamp();
    const duplicateProject: ProjectDocument = {
      ...sourceProject,
      id: makeUniqueProjectId(
        projects.map((candidate) => candidate.id),
        duplicateName
      ),
      name: duplicateName,
      createdAt: timestamp,
      updatedAt: timestamp
    };

    writeBrowserProjects([duplicateProject, ...projects]);
    return duplicateProject;
  },

  async deleteProject(projectId) {
    const projects = readBrowserProjects();
    writeBrowserProjects(
      projects.filter((candidate) => candidate.id !== projectId)
    );
  },

  async exportProject(projectId) {
    const project = await browserProjectService.loadProject(projectId);
    return makeProjectDataUrl(project);
  },

  async writeKicadBundle() {
    throw new Error(
      "Writing a KiCad bundle requires the desktop app — the web preview cannot write files."
    );
  }
};

async function invokeTauri<T>(command: string, args?: Record<string, unknown>) {
  const { invoke } = await import("@tauri-apps/api/core");
  return invoke<T>(command, args);
}

const tauriProjectService: ProjectService = {
  async loadProjects() {
    return projectDocumentSchema
      .array()
      .parse(await invokeTauri("load_projects"));
  },

  async createProject(input) {
    return projectDocumentSchema.parse(
      await invokeTauri("create_project", { input })
    );
  },

  async loadProject(projectId) {
    return projectDocumentSchema.parse(
      await invokeTauri("load_project", { projectId })
    );
  },

  async saveProject(project) {
    return projectDocumentSchema.parse(
      await invokeTauri("save_project", { project })
    );
  },

  async renameProject(projectId, name) {
    return projectDocumentSchema.parse(
      await invokeTauri("rename_project", { projectId, name })
    );
  },

  async duplicateProject(projectId, name) {
    return projectDocumentSchema.parse(
      await invokeTauri("duplicate_project", { projectId, name })
    );
  },

  async deleteProject(projectId) {
    await invokeTauri("delete_project", { projectId });
  },

  async exportProject(projectId) {
    return invokeTauri<string>("export_project", { projectId });
  },

  async writeKicadBundle(projectId, files) {
    return invokeTauri<string>("write_kicad_bundle", { projectId, files });
  }
};

export function getProjectService(): ProjectService {
  return isTauriRuntime() ? tauriProjectService : browserProjectService;
}

export { browserProjectService };
