import { useEffect, type ReactElement } from "react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, beforeEach } from "vitest";
import { ProjectShell } from "./ProjectShell";
import { useProjectShell } from "./project-shell-context";
import { useWorkspaceStore } from "../projects/project-store";
import type { WorkspaceProject } from "../../types/domain";

function fakeProject(): WorkspaceProject {
  return {
    id: "rocket-fc",
    name: "Rocket FC",
    description: "",
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

function renderShellWith(child: ReactElement) {
  return render(
    <MemoryRouter initialEntries={["/workspace/overview"]}>
      <Routes>
        <Route path="/workspace" element={<ProjectShell />}>
          <Route path="overview" element={child} />
        </Route>
        <Route path="/projects" element={<div>Projects fallback</div>} />
      </Routes>
    </MemoryRouter>
  );
}

beforeEach(() => {
  useWorkspaceStore.setState({
    currentProject: fakeProject(),
    isSaving: false,
    exportResult: null
  });
});

describe("ProjectShell inspector slot", () => {
  it("renders no inspector when no child mounts content", () => {
    function Plain() {
      return <p>main content</p>;
    }
    renderShellWith(<Plain />);
    expect(screen.getByText("main content")).toBeInTheDocument();
    expect(
      screen.queryByRole("complementary", { name: "Project inspector" })
    ).not.toBeInTheDocument();
  });

  it("renders the inspector aside when a child calls setInspector()", () => {
    function ChildWithInspector() {
      const { setInspector } = useProjectShell();
      useEffect(() => {
        setInspector(<p>inspector content</p>);
        return () => setInspector(null);
      }, [setInspector]);
      return <p>main content</p>;
    }
    renderShellWith(<ChildWithInspector />);
    expect(screen.getByText("main content")).toBeInTheDocument();
    expect(screen.getByText("inspector content")).toBeInTheDocument();
    expect(
      screen.getByRole("complementary", { name: "Project inspector" })
    ).toBeInTheDocument();
  });
});
