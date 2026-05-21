import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { WorkspaceProject } from "../../types/domain";
import { ProjectsPage } from "./ProjectsPage";
import { useWorkspaceStore } from "./project-store";

vi.mock("../../lib/runtime", () => ({
  getRuntimeLabel: () => "Web preview",
  isTauriRuntime: () => false
}));

function fakeProject(): WorkspaceProject {
  return {
    id: "rocket-fc",
    name: "Rocket FC",
    description: "Flight controller workspace",
    status: "Draft",
    voltageDomain: "3.3V",
    template: "Blank project",
    outputTarget: "Generate KiCad starter project",
    controller: {
      id: "stm32f405rg",
      name: "STM32F405RG",
      packageName: "LQFP-64",
      voltage: "3.3V",
      notes: "",
      protocols: ["SPI"],
      interfaces: [],
      gpioPins: []
    },
    components: [],
    connections: [],
    issues: [],
    createdAt: "2026-05-19T00:00:00.000Z",
    updatedAt: "2026-05-19T00:00:00.000Z"
  };
}

describe("ProjectsPage", () => {
  beforeEach(() => {
    useWorkspaceStore.setState({
      projects: [fakeProject()],
      activeProjectId: null,
      currentProjectDocument: null,
      currentProject: null,
      isInitialized: true,
      isLoading: false,
      isSaving: false,
      isExporting: false,
      errorMessage: null,
      exportResult: null
    });
  });

  it("disables project deletion in web preview", () => {
    render(
      <MemoryRouter>
        <ProjectsPage />
      </MemoryRouter>
    );

    const deleteButton = screen.getByRole("button", { name: "Delete" });
    expect(deleteButton).toBeDisabled();
    expect(deleteButton).toHaveAttribute(
      "title",
      "Open the desktop app to delete projects."
    );
  });
});
