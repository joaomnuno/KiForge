import { useMemo } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useLocation, useNavigate } from "react-router-dom";
import { AppScaffold } from "../../components/layout/AppScaffold";
import { Button } from "../../components/ui/Button";
import { Panel } from "../../components/ui/Panel";
import { catalog } from "../catalog/catalog";
import { findProjectTemplate } from "../templates/templates-catalog";
import { getInitialControllerId } from "./project-mappers";
import { createProjectInputSchema } from "./project-schemas";
import { useWorkspaceStore } from "./project-store";
import type { CreateProjectInput } from "../../types/domain";

interface NewProjectLocationState {
  templateId?: string;
}

export function NewProjectPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const incomingTemplateId =
    (location.state as NewProjectLocationState | null)?.templateId ?? null;
  const incomingTemplate = findProjectTemplate(incomingTemplateId);
  const createProject = useWorkspaceStore((state) => state.createProject);
  const addComponentToCurrentProject = useWorkspaceStore(
    (state) => state.addComponentToCurrentProject
  );
  const isSaving = useWorkspaceStore((state) => state.isSaving);
  const errorMessage = useWorkspaceStore((state) => state.errorMessage);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm<CreateProjectInput>({
    resolver: zodResolver(createProjectInputSchema),
    defaultValues: {
      name: incomingTemplate?.defaultProjectName ?? "Flight Controller Rev B",
      description:
        incomingTemplate?.defaultDescription ??
        "Next-gen drone controller with high-speed logging and sensing.",
      controllerId: incomingTemplate?.controllerId ?? getInitialControllerId(),
      template: incomingTemplate?.name ?? "Blank project",
      voltageDomain: incomingTemplate?.voltageDomain ?? "3.3V",
      outputTarget:
        incomingTemplate?.outputTarget ?? "Generate KiCad starter project"
    }
  });

  const selectedControllerId = watch("controllerId");

  const selectedController = useMemo(
    () =>
      catalog.controllers.find(
        (controller) => controller.id === selectedControllerId
      ) ?? catalog.controllers[0],
    [selectedControllerId]
  );

  async function onSubmit(values: CreateProjectInput) {
    const project = await createProject(values);
    if (!project) {
      return;
    }

    if (incomingTemplate) {
      for (const componentId of incomingTemplate.componentCatalogIds) {
        await addComponentToCurrentProject(componentId);
      }
    }

    navigate("/workspace/components");
  }

  return (
    <AppScaffold
      activeNav="projects"
      searchPlaceholder="Search controllers, templates, or recent projects..."
      inspector={
        <>
          {selectedController ? (
            <Panel
              eyebrow="Selected controller"
              title={selectedController.name}
              description={selectedController.notes}
            >
              <dl className="fact-grid">
                <div>
                  <dt>Package</dt>
                  <dd>{selectedController.packageName}</dd>
                </div>
                <div>
                  <dt>Voltage</dt>
                  <dd>{selectedController.voltage}</dd>
                </div>
                <div>
                  <dt>Interfaces</dt>
                  <dd>{selectedController.interfaces.length}</dd>
                </div>
              </dl>

              <div className="chip-row">
                {selectedController.protocols.map((protocol) => (
                  <span key={protocol} className="chip">
                    {protocol}
                  </span>
                ))}
              </div>
            </Panel>
          ) : null}

          <Panel
            eyebrow="Setup notes"
            title="What this page locks in"
            description="Identity, controller choice, voltage domain, and output target are confirmed here before you add devices."
          >
            <ul className="list-reset stack-sm">
              <li className="inspector-row">
                <strong>Controller choice</strong>
                <span>
                  Drives interface availability and pin candidates later.
                </span>
              </li>
              <li className="inspector-row">
                <strong>Template</strong>
                <span>
                  Preselects defaults but every field stays editable here.
                </span>
              </li>
              <li className="inspector-row">
                <strong>Output target</strong>
                <span>Defaults to a KiCad starter project bundle.</span>
              </li>
            </ul>
          </Panel>
        </>
      }
    >
      <div className="page-stack page-stack--narrow">
        <section className="page-hero">
          <div>
            <p className="eyebrow">New workspace</p>
            <h1 className="page-title">Create New Project</h1>
            <p className="page-subtitle">
              Define the identity and target platform before adding devices.
            </p>
          </div>
        </section>

        <Panel>
          <form className="form-grid" onSubmit={handleSubmit(onSubmit)}>
            <label className="field">
              <span>Project name</span>
              <input {...register("name")} className="field__control" />
              {errors.name ? (
                <small className="field__error">{errors.name.message}</small>
              ) : null}
            </label>

            <label className="field field--full">
              <span>Description</span>
              <textarea
                {...register("description")}
                className="field__control field__control--textarea"
                rows={4}
              />
              {errors.description ? (
                <small className="field__error">
                  {errors.description.message}
                </small>
              ) : null}
            </label>

            <label className="field">
              <span>Target controller</span>
              <select {...register("controllerId")} className="field__control">
                {catalog.controllers.map((controller) => (
                  <option key={controller.id} value={controller.id}>
                    {controller.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>Project template</span>
              <select {...register("template")} className="field__control">
                <option>Blank project</option>
                <option>Sensor board</option>
                <option>Data logger</option>
                <option>Communications node</option>
              </select>
            </label>

            <label className="field">
              <span>Voltage domain</span>
              <select {...register("voltageDomain")} className="field__control">
                <option>3.3V</option>
                <option>5V</option>
                <option>Mixed</option>
                <option>Undecided</option>
              </select>
            </label>

            <label className="field">
              <span>Output target</span>
              <select {...register("outputTarget")} className="field__control">
                <option>Generate KiCad starter project</option>
                <option>Generate components only</option>
                <option>Generate starter sheet structure</option>
              </select>
            </label>

            {errorMessage ? (
              <p className="form-note field--full">{errorMessage}</p>
            ) : null}

            <div className="form-actions field--full">
              <Button
                onClick={() => navigate("/projects")}
                type="button"
                variant="ghost"
              >
                Cancel
              </Button>
              <Button disabled={isSaving} type="submit">
                {isSaving ? "Creating..." : "Create project"}
              </Button>
            </div>
          </form>
        </Panel>
      </div>
    </AppScaffold>
  );
}
