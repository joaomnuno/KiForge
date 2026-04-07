import { useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { AppScaffold } from "../../components/layout/AppScaffold";
import { Button } from "../../components/ui/Button";
import { Panel } from "../../components/ui/Panel";
import { controllerOptions } from "../../data/mockData";

const newProjectSchema = z.object({
  name: z.string().min(3, "Use at least 3 characters."),
  description: z.string().min(8, "Add a short context note."),
  controllerId: z.string().min(1, "Choose a target controller."),
  template: z.string().min(1),
  voltageDomain: z.enum(["3.3V", "5V", "Mixed", "Undecided"]),
  outputTarget: z.enum([
    "Generate KiCad starter project",
    "Generate components only",
    "Generate starter sheet structure"
  ])
});

type NewProjectFormValues = z.infer<typeof newProjectSchema>;

export function NewProjectPage() {
  const [submitted, setSubmitted] = useState(false);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm<NewProjectFormValues>({
    resolver: zodResolver(newProjectSchema),
    defaultValues: {
      name: "Flight Controller Rev B",
      description: "Next-gen drone controller with high-speed logging and sensing.",
      controllerId: controllerOptions[0].id,
      template: "Blank project",
      voltageDomain: "3.3V",
      outputTarget: "Generate KiCad starter project"
    }
  });

  const selectedControllerId = watch("controllerId");

  const selectedController = useMemo(
    () =>
      controllerOptions.find(
        (controller) => controller.id === selectedControllerId
      ) ?? controllerOptions[0],
    [selectedControllerId]
  );

  return (
    <AppScaffold
      activeNav="projects"
      searchPlaceholder="Search controllers, templates, or recent projects..."
      inspector={
        <>
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

          <Panel
            eyebrow="Setup notes"
            title="What this page should lock in"
            description="Keep the MVP focused on identity, controller choice, voltage domain, and output target."
          >
            <ul className="list-reset stack-sm">
              <li className="inspector-row">
                <strong>Controller choice</strong>
                <span>Drives interface availability and pin candidates later.</span>
              </li>
              <li className="inspector-row">
                <strong>Template</strong>
                <span>Should remain optional and local for the first release.</span>
              </li>
              <li className="inspector-row">
                <strong>Output target</strong>
                <span>Defaults to a KiCad starter project for the MVP path.</span>
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
          <form
            className="form-grid"
            onSubmit={handleSubmit(() => setSubmitted(true))}
          >
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
                <small className="field__error">{errors.description.message}</small>
              ) : null}
            </label>

            <label className="field">
              <span>Target controller</span>
              <select {...register("controllerId")} className="field__control">
                {controllerOptions.map((controller) => (
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

            <div className="form-actions field--full">
              <Button type="button" variant="ghost">
                Cancel
              </Button>
              <Button type="submit">Create project</Button>
            </div>

            {submitted ? (
              <p className="form-note">
                Form validation is wired. Project creation is still mocked until the
                Rust persistence commands are connected.
              </p>
            ) : null}
          </form>
        </Panel>
      </div>
    </AppScaffold>
  );
}
