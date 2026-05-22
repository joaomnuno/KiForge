import { useEffect, type ReactElement } from "react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import { ProjectShell } from "./ProjectShell";
import { useProjectShell } from "./project-shell-context";
import { useWorkspaceStore } from "../projects/project-store";

const tauriDialogOpen = vi.fn();
vi.mock("@tauri-apps/plugin-dialog", () => ({
  open: (...args: unknown[]) => tauriDialogOpen(...args)
}));
import type {
  WorkspaceConnection,
  WorkspaceProject,
  WorkspaceProjectComponent
} from "../../types/domain";

function fakeProject(
  overrides: Partial<WorkspaceProject> = {}
): WorkspaceProject {
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
    updatedAt: "2026-05-19T00:00:00.000Z",
    ...overrides
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
  Object.defineProperty(window, "__TAURI_INTERNALS__", {
    configurable: true,
    value: {}
  });

  useWorkspaceStore.setState({
    currentProject: fakeProject(),
    isSaving: false,
    exportResult: null
  });
});

afterEach(() => {
  Reflect.deleteProperty(window, "__TAURI_INTERNALS__");
  tauriDialogOpen.mockReset();
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

function fakeComponent(
  id: string,
  instanceName = id
): WorkspaceProjectComponent {
  return {
    id,
    catalogId: `${id}-catalog`,
    instanceName,
    status: "Connected",
    preferredProtocol: "SPI",
    part: {
      id: `${id}-catalog`,
      name: id.toUpperCase(),
      categoryId: "sensor",
      categoryLabel: "Sensor",
      summary: "",
      voltage: "3.3V",
      packageName: "SOP-8",
      supportedProtocols: ["SPI"],
      connectionOptions: []
    },
    partName: id.toUpperCase(),
    supportedProtocols: ["SPI"]
  };
}

function fakeValidConnection(
  id: string,
  componentId: string
): WorkspaceConnection {
  return {
    id,
    componentId,
    protocol: "SPI",
    controllerInterface: "SPI1",
    pins: ["PA5", "PA6", "PA7"],
    busMode: "Dedicated",
    optionalSignals: [],
    status: "Valid",
    assignments: [
      {
        signal: "SCK",
        selectedPin: "PA5",
        alternatePins: ["PA5"],
        status: "Valid"
      }
    ],
    name: componentId,
    peerPart: componentId
  };
}

describe("ProjectShell export button", () => {
  it("renders the Export button disabled when the project is not Ready to Generate", () => {
    renderShellWith(<p>main content</p>);
    const button = screen.getByRole("button", { name: /Export KiCad bundle/i });
    expect(button).toBeDisabled();
  });

  it("renders the Export button enabled when the project is Ready to Generate", () => {
    useWorkspaceStore.setState({
      currentProject: {
        ...fakeProject(),
        components: [fakeComponent("flash", "Flash")],
        connections: [fakeValidConnection("c1", "flash")]
      }
    });
    renderShellWith(<p>main content</p>);
    const button = screen.getByRole("button", { name: /Export KiCad bundle/i });
    expect(button).toBeEnabled();
  });

  it("renders the Export button disabled in web preview", () => {
    Reflect.deleteProperty(window, "__TAURI_INTERNALS__");
    useWorkspaceStore.setState({
      currentProject: {
        ...fakeProject(),
        components: [fakeComponent("flash", "Flash")],
        connections: [fakeValidConnection("c1", "flash")]
      }
    });
    renderShellWith(<p>main content</p>);
    const button = screen.getByRole("button", { name: /Export KiCad bundle/i });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute(
      "title",
      "Open the desktop app to export KiCad bundles."
    );
  });

  it("opens the folder picker and invokes the store action with the picked dir", async () => {
    tauriDialogOpen.mockResolvedValueOnce("/tmp/picked-export-dir");
    const action = vi
      .fn()
      .mockResolvedValue({ target: "/tmp/picked-export-dir" });
    useWorkspaceStore.setState({
      currentProject: {
        ...fakeProject(),
        components: [fakeComponent("flash", "Flash")],
        connections: [fakeValidConnection("c1", "flash")]
      },
      exportKicadBundleForCurrentProject: action
    });
    renderShellWith(<p>main content</p>);
    const user = userEvent.setup();
    await user.click(
      screen.getByRole("button", { name: /Export KiCad bundle/i })
    );
    expect(tauriDialogOpen).toHaveBeenCalledTimes(1);
    expect(action).toHaveBeenCalledWith("/tmp/picked-export-dir");
  });

  it("does not invoke the store action when the user cancels the picker", async () => {
    tauriDialogOpen.mockResolvedValueOnce(null);
    const action = vi.fn().mockResolvedValue(null);
    useWorkspaceStore.setState({
      currentProject: {
        ...fakeProject(),
        components: [fakeComponent("flash", "Flash")],
        connections: [fakeValidConnection("c1", "flash")]
      },
      exportKicadBundleForCurrentProject: action
    });
    renderShellWith(<p>main content</p>);
    const user = userEvent.setup();
    await user.click(
      screen.getByRole("button", { name: /Export KiCad bundle/i })
    );
    expect(tauriDialogOpen).toHaveBeenCalledTimes(1);
    expect(action).not.toHaveBeenCalled();
  });

  it("renders the derived status (not the stored ProjectDocument.status) in the header badge", () => {
    useWorkspaceStore.setState({
      currentProject: {
        ...fakeProject(),
        status: "Draft", // stored
        components: [fakeComponent("flash", "Flash")],
        connections: [fakeValidConnection("c1", "flash")],
        lastExportedAt: "2026-05-21T10:15:30.000Z"
      }
    });
    renderShellWith(<p>main content</p>);
    expect(screen.getByText("Generated")).toBeInTheDocument();
    expect(screen.queryByText("Draft")).not.toBeInTheDocument();
  });
});
