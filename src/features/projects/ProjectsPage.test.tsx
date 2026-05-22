import { MemoryRouter, Route, Routes } from "react-router-dom";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { WorkspaceProject } from "../../types/domain";
import { ProjectsPage } from "./ProjectsPage";
import { useWorkspaceStore } from "./project-store";

vi.mock("../../lib/runtime", () => ({
  getRuntimeLabel: () => "Web preview",
  isTauriRuntime: () => false
}));

function fakeProject(
  overrides: Partial<WorkspaceProject> = {}
): WorkspaceProject {
  return {
    id: "rocket-fc",
    name: "Rocket FC",
    description: "Flight controller",
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
    updatedAt: "2026-05-19T00:00:00.000Z",
    ...overrides
  };
}

function renderProjectsPage() {
  return render(
    <MemoryRouter initialEntries={["/projects"]}>
      <Routes>
        <Route path="/projects" element={<ProjectsPage />} />
      </Routes>
    </MemoryRouter>
  );
}

beforeEach(() => {
  window.localStorage.clear();
  useWorkspaceStore.setState({
    projects: [
      fakeProject(),
      fakeProject({
        id: "utility-board",
        name: "Utility Board",
        description: "USB utility board",
        controller: {
          id: "rp2040",
          name: "RP2040",
          packageName: "QFN-56",
          voltage: "3.3V",
          notes: "",
          protocols: ["USB"],
          interfaces: [],
          gpioPins: []
        }
      }),
      fakeProject({
        id: "h7-logger",
        name: "Data Logger",
        description: "High-throughput logger",
        controller: {
          id: "stm32h743zi",
          name: "STM32H743ZI",
          packageName: "LQFP-144",
          voltage: "3.3V",
          notes: "",
          protocols: ["SPI"],
          interfaces: [],
          gpioPins: []
        }
      })
    ],
    currentProject: null,
    currentProjectDocument: null,
    activeProjectId: null,
    isInitialized: true,
    isLoading: false,
    isSaving: false,
    isExporting: false,
    errorMessage: null,
    exportResult: null
  });
});

describe("ProjectsPage web preview", () => {
  it("disables project deletion when not in the Tauri runtime", () => {
    const { container } = renderProjectsPage();

    const deleteButtons = Array.from(
      container.querySelectorAll<HTMLButtonElement>(
        'button[title="Open the desktop app to delete projects."]'
      )
    );
    expect(deleteButtons.length).toBeGreaterThan(0);
    for (const deleteButton of deleteButtons) {
      expect(deleteButton).toBeDisabled();
      expect(deleteButton).toHaveAttribute(
        "title",
        "Open the desktop app to delete projects."
      );
    }
  });
});

describe("ProjectsPage search", () => {
  it("filters visible project cards by project name, controller, and id", async () => {
    const user = userEvent.setup();
    renderProjectsPage();

    const search = screen.getByRole("searchbox", { name: /search projects/i });

    await user.type(search, "rp2040");
    expect(
      screen.getByRole("heading", { level: 2, name: "Utility Board" })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { level: 2, name: "Rocket FC" })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { level: 2, name: "Data Logger" })
    ).not.toBeInTheDocument();

    await user.clear(search);
    await user.type(search, "h7-logger");
    expect(
      screen.getByRole("heading", { level: 2, name: "Data Logger" })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { level: 2, name: "Utility Board" })
    ).not.toBeInTheDocument();

    await user.clear(search);
    await user.type(search, "rocket");
    expect(
      screen.getByRole("heading", { level: 2, name: "Rocket FC" })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { level: 2, name: "Data Logger" })
    ).not.toBeInTheDocument();
  });
});
