import { create } from "zustand";
import { currentWorkspace, projectSummaries } from "../../data/mockData";
import type { ProjectSummary, WorkspaceProject } from "../../types/domain";

interface WorkspaceState {
  projects: ProjectSummary[];
  currentProject: WorkspaceProject;
  activeProjectId: string;
  selectProject: (projectId: string) => void;
}

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  projects: projectSummaries,
  currentProject: currentWorkspace,
  activeProjectId: currentWorkspace.id,
  selectProject: (projectId) =>
    set((state) => {
      const nextProject =
        state.projects.find((project) => project.id === projectId)?.id ===
        currentWorkspace.id
          ? currentWorkspace
          : currentWorkspace;

      return {
        activeProjectId: projectId,
        currentProject: nextProject
      };
    })
}));
