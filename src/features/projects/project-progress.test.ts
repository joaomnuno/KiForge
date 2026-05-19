import { getProjectProgress } from "./project-progress";
import type {
  ComponentCatalogEntry,
  ControllerCatalogEntry,
  ProjectExportResult,
  WorkspaceConnection,
  WorkspaceProject,
  WorkspaceProjectComponent
} from "../../types/domain";

function makeController(): ControllerCatalogEntry {
  return {
    id: "stm32f405rg",
    name: "STM32F405RG",
    packageName: "LQFP-64",
    voltage: "3.3V",
    notes: "",
    protocols: ["SPI", "I2C"],
    interfaces: [],
    gpioPins: []
  };
}

function makePart(id: string, name: string): ComponentCatalogEntry {
  return {
    id,
    name,
    categoryId: "sensor",
    categoryLabel: "Sensor",
    summary: "",
    voltage: "3.3V",
    packageName: "SOP-8",
    supportedProtocols: ["SPI"],
    connectionOptions: []
  };
}

function makeComponent(
  id: string,
  instanceName: string
): WorkspaceProjectComponent {
  const part = makePart(`${id}-catalog`, instanceName);

  return {
    id,
    catalogId: part.id,
    instanceName,
    status: "Unconnected",
    preferredProtocol: "SPI",
    part,
    partName: part.name,
    supportedProtocols: part.supportedProtocols
  };
}

function makeConnection(
  id: string,
  componentId: string,
  assignmentStatus: "Valid" | "Needs confirmation" | "Conflict" = "Valid"
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
        status: assignmentStatus
      }
    ],
    name: componentId,
    peerPart: componentId
  };
}

function makeProject(
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
    controller: makeController(),
    components: [],
    connections: [],
    issues: [],
    createdAt: "2026-04-07T00:00:00.000Z",
    updatedAt: "2026-04-07T00:00:00.000Z",
    ...overrides
  };
}

describe("getProjectProgress", () => {
  it("treats every step as empty when project is null", () => {
    const progress = getProjectProgress(null);

    expect(progress.totalCount).toBe(6);
    expect(progress.completedCount).toBe(0);
    expect(progress.percentComplete).toBe(0);
    expect(progress.nextStepId).toBe("identity");
    for (const step of progress.steps) {
      expect(step.status).toBe("empty");
    }
  });

  it("marks identity complete and components/connections empty when project has zero components", () => {
    const project = makeProject();
    const progress = getProjectProgress(project);

    const stepById = new Map(progress.steps.map((step) => [step.id, step]));

    expect(stepById.get("identity")?.status).toBe("complete");
    expect(stepById.get("identity")?.summary).toBe("STM32F405RG · 3.3V");
    expect(stepById.get("components")?.status).toBe("empty");
    expect(stepById.get("connections")?.status).toBe("empty");
    expect(stepById.get("pin-mapping")?.status).toBe("empty");
    expect(stepById.get("validation")?.status).toBe("complete");
    expect(stepById.get("export")?.status).toBe("empty");
    expect(progress.nextStepId).toBe("components");
  });

  it("keeps connections empty when components exist but no connections", () => {
    const project = makeProject({
      components: [makeComponent("flash", "Flash")]
    });
    const progress = getProjectProgress(project);

    const stepById = new Map(progress.steps.map((step) => [step.id, step]));

    expect(stepById.get("components")?.status).toBe("complete");
    expect(stepById.get("components")?.summary).toBe("1 device(s) in scope");
    expect(stepById.get("connections")?.status).toBe("empty");
    expect(stepById.get("pin-mapping")?.status).toBe("empty");
  });

  it("marks connections and pin-mapping complete when every component connected with valid signals", () => {
    const project = makeProject({
      components: [
        makeComponent("flash", "Flash"),
        makeComponent("imu", "IMU")
      ],
      connections: [
        makeConnection("c-flash", "flash", "Valid"),
        makeConnection("c-imu", "imu", "Valid")
      ]
    });

    const progress = getProjectProgress(project);
    const stepById = new Map(progress.steps.map((step) => [step.id, step]));

    expect(stepById.get("connections")?.status).toBe("complete");
    expect(stepById.get("connections")?.summary).toBe(
      "2 of 2 devices connected"
    );
    expect(stepById.get("pin-mapping")?.status).toBe("complete");
    expect(stepById.get("pin-mapping")?.summary).toBe("All signals valid");
  });

  it("marks connections attention when only some components have connections", () => {
    const project = makeProject({
      components: [
        makeComponent("flash", "Flash"),
        makeComponent("imu", "IMU")
      ],
      connections: [makeConnection("c-flash", "flash", "Valid")]
    });

    const progress = getProjectProgress(project);
    const stepById = new Map(progress.steps.map((step) => [step.id, step]));

    expect(stepById.get("connections")?.status).toBe("attention");
    expect(stepById.get("connections")?.summary).toBe(
      "1 of 2 devices connected"
    );
  });

  it("marks pin-mapping blocked when any assignment is in conflict", () => {
    const project = makeProject({
      components: [makeComponent("flash", "Flash")],
      connections: [makeConnection("c-flash", "flash", "Conflict")]
    });

    const progress = getProjectProgress(project);
    const stepById = new Map(progress.steps.map((step) => [step.id, step]));

    expect(stepById.get("pin-mapping")?.status).toBe("blocked");
    expect(stepById.get("pin-mapping")?.summary).toBe("1 signal conflict(s)");
  });

  it("marks pin-mapping attention when assignments need confirmation", () => {
    const project = makeProject({
      components: [makeComponent("flash", "Flash")],
      connections: [makeConnection("c-flash", "flash", "Needs confirmation")]
    });

    const progress = getProjectProgress(project);
    const stepById = new Map(progress.steps.map((step) => [step.id, step]));

    expect(stepById.get("pin-mapping")?.status).toBe("attention");
    expect(stepById.get("pin-mapping")?.summary).toBe(
      "1 signal(s) need confirmation"
    );
  });

  it("marks validation blocked when issues include an error", () => {
    const project = makeProject({
      issues: [
        { id: "i1", severity: "error", message: "Bad" },
        { id: "i2", severity: "warning", message: "Hmm" }
      ]
    });

    const progress = getProjectProgress(project);
    const stepById = new Map(progress.steps.map((step) => [step.id, step]));

    expect(stepById.get("validation")?.status).toBe("blocked");
    expect(stepById.get("validation")?.summary).toBe(
      "1 error(s), 1 warning(s)"
    );
  });

  it("marks validation attention when only warnings exist", () => {
    const project = makeProject({
      issues: [{ id: "i2", severity: "warning", message: "Hmm" }]
    });

    const progress = getProjectProgress(project);
    const stepById = new Map(progress.steps.map((step) => [step.id, step]));

    expect(stepById.get("validation")?.status).toBe("attention");
    expect(stepById.get("validation")?.summary).toBe(
      "0 error(s), 1 warning(s)"
    );
  });

  it("marks export complete when the export result matches the project id", () => {
    const project = makeProject({
      components: [makeComponent("flash", "Flash")],
      connections: [makeConnection("c-flash", "flash", "Valid")]
    });

    const exportResult: ProjectExportResult = {
      projectId: project.id,
      projectName: project.name,
      fileName: "rocket-fc-project.json",
      target: "/tmp/rocket-fc-project.json",
      kind: "file-path",
      message: "ok",
      exportedAt: "2026-05-01T00:00:00.000Z"
    };

    const progress = getProjectProgress(project, exportResult);
    const stepById = new Map(progress.steps.map((step) => [step.id, step]));

    expect(stepById.get("export")?.status).toBe("complete");
    expect(stepById.get("export")?.summary).toBe(
      "Exported rocket-fc-project.json"
    );
    expect(progress.completedCount).toBe(6);
    expect(progress.percentComplete).toBe(100);
    expect(progress.nextStepId).toBe(null);
  });

  it("ignores export result when the project id mismatches", () => {
    const project = makeProject();

    const exportResult: ProjectExportResult = {
      projectId: "other-project",
      projectName: "Other",
      fileName: "other.json",
      target: "/tmp/other.json",
      kind: "file-path",
      message: "ok",
      exportedAt: "2026-05-01T00:00:00.000Z"
    };

    const progress = getProjectProgress(project, exportResult);
    const stepById = new Map(progress.steps.map((step) => [step.id, step]));

    expect(stepById.get("export")?.status).toBe("empty");
  });
});
