import { browserProjectService } from "./project-service";

describe("browserProjectService", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("creates, renames, duplicates, and deletes projects in browser storage", async () => {
    const created = await browserProjectService.createProject({
      name: "Rocket FC",
      description: "Flight controller workspace",
      controllerId: "stm32h743zi",
      template: "Blank project",
      voltageDomain: "3.3V",
      outputTarget: "Generate KiCad starter project"
    });

    expect(created.id).toBe("rocket-fc");

    const renamed = await browserProjectService.renameProject(
      created.id,
      "Rocket FC Rev B"
    );
    expect(renamed.name).toBe("Rocket FC Rev B");

    const duplicate = await browserProjectService.duplicateProject(created.id);
    expect(duplicate.id).toBe("rocket-fc-rev-b-copy");

    const listed = await browserProjectService.loadProjects();
    expect(listed).toHaveLength(2);

    await browserProjectService.deleteProject(created.id);

    const remaining = await browserProjectService.loadProjects();
    expect(remaining).toHaveLength(1);
    expect(remaining[0]?.id).toBe(duplicate.id);
  });

  it("round-trips lastExportedAt through browser storage", async () => {
    const created = await browserProjectService.createProject({
      name: "Rocket FC",
      description: "Flight controller workspace",
      controllerId: "stm32h743zi",
      template: "Blank project",
      voltageDomain: "3.3V",
      outputTarget: "Generate KiCad starter project"
    });
    const lastExportedAt = "2026-05-21T10:15:30.000Z";

    await browserProjectService.saveProject({
      ...created,
      lastExportedAt
    });

    const loaded = await browserProjectService.loadProject(created.id);
    const listed = await browserProjectService.loadProjects();

    expect(loaded.lastExportedAt).toBe(lastExportedAt);
    expect(listed[0]?.lastExportedAt).toBe(lastExportedAt);
  });
});
