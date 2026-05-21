import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { Panel } from "../../components/ui/Panel";
import { StatusBadge } from "../../components/ui/StatusBadge";
import {
  Tabs,
  TabsList,
  TabsPanel,
  TabsTrigger
} from "../../components/ui/Tabs";
import { catalog } from "../catalog/catalog";
import { useWorkspaceStore } from "../projects/project-store";
import {
  deriveProjectStatus,
  getProjectProgress,
  type ProjectStepId,
  type ProjectStepProgress
} from "../projects/project-progress";
import { voltageDomains, type VoltageDomain } from "../../types/domain";

type OverviewTabValue = "setup" | "connectivity" | "output";

const overviewTabs: {
  value: OverviewTabValue;
  label: string;
  stepIds: ProjectStepId[];
}[] = [
  { value: "setup", label: "Setup", stepIds: ["identity", "components"] },
  {
    value: "connectivity",
    label: "Connectivity",
    stepIds: ["connections", "pin-mapping"]
  },
  { value: "output", label: "Output", stepIds: ["validation", "export"] }
];

export function ProjectOverviewPage() {
  const currentProject = useWorkspaceStore((state) => state.currentProject);
  const exportResult = useWorkspaceStore((state) => state.exportResult);
  const isSaving = useWorkspaceStore((state) => state.isSaving);
  const updateCurrentProjectIdentity = useWorkspaceStore(
    (state) => state.updateCurrentProjectIdentity
  );

  const [isEditingIdentity, setIsEditingIdentity] = useState(false);
  const [descriptionDraft, setDescriptionDraft] = useState("");
  const [controllerIdDraft, setControllerIdDraft] = useState("");
  const [voltageDraft, setVoltageDraft] = useState<VoltageDomain>("3.3V");

  if (!currentProject) {
    return null;
  }

  const progress = getProjectProgress(currentProject, exportResult);
  const projectStatus = deriveProjectStatus(
    progress,
    Boolean(currentProject.lastExportedAt)
  );
  const stepById = new Map(progress.steps.map((step) => [step.id, step]));
  const defaultTabValue = getDefaultOverviewTab(progress.nextStepId);
  const nextStep = progress.nextStepId
    ? (progress.steps.find((step) => step.id === progress.nextStepId) ?? null)
    : null;

  const errorCount = currentProject.issues.filter(
    (issue) => issue.severity === "error"
  ).length;
  const warningCount = currentProject.issues.filter(
    (issue) => issue.severity === "warning"
  ).length;
  const totalIssues = currentProject.issues.length;

  function openEdit() {
    if (!currentProject) {
      return;
    }
    setDescriptionDraft(currentProject.description);
    setControllerIdDraft(currentProject.controller.id);
    setVoltageDraft(currentProject.voltageDomain);
    setIsEditingIdentity(true);
  }

  async function handleSaveIdentity() {
    await updateCurrentProjectIdentity({
      description: descriptionDraft,
      controllerId: controllerIdDraft,
      voltageDomain: voltageDraft
    });
    setIsEditingIdentity(false);
  }

  return (
    <div className="page-stack">
      <Panel
        eyebrow="Project overview"
        title={currentProject.name}
        description={
          currentProject.description || "No project description yet."
        }
        headerActions={<StatusBadge label={projectStatus} />}
      >
        {isEditingIdentity ? (
          <form
            className="stack-sm"
            onSubmit={(event) => {
              event.preventDefault();
              void handleSaveIdentity();
            }}
            aria-label="Edit project identity"
          >
            <label className="field">
              <span>Description</span>
              <textarea
                className="field__control"
                rows={3}
                value={descriptionDraft}
                onChange={(event) => setDescriptionDraft(event.target.value)}
                required
              />
            </label>

            <label className="field">
              <span>Controller</span>
              <select
                className="field__control"
                value={controllerIdDraft}
                onChange={(event) => setControllerIdDraft(event.target.value)}
              >
                {catalog.controllers.map((controller) => (
                  <option key={controller.id} value={controller.id}>
                    {controller.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>Voltage domain</span>
              <select
                className="field__control"
                value={voltageDraft}
                onChange={(event) =>
                  setVoltageDraft(event.target.value as VoltageDomain)
                }
              >
                {voltageDomains.map((domain) => (
                  <option key={domain} value={domain}>
                    {domain}
                  </option>
                ))}
              </select>
            </label>

            <div className="button-group">
              <Button variant="primary" type="submit" disabled={isSaving}>
                {isSaving ? "Saving..." : "Save identity"}
              </Button>
              <Button
                variant="secondary"
                type="button"
                onClick={() => setIsEditingIdentity(false)}
                disabled={isSaving}
              >
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <div className="button-group">
            {nextStep ? (
              <Link className="button button--primary" to={nextStep.href}>
                Resume {nextStep.label}
              </Link>
            ) : (
              <p className="planner-note">All steps complete.</p>
            )}
            <Button variant="secondary" type="button" onClick={openEdit}>
              Edit identity
            </Button>
          </div>
        )}
      </Panel>

      <Panel
        eyebrow="Progress"
        title="Steps"
        description="Each step links into the detailed workspace page."
      >
        <Tabs defaultValue={defaultTabValue}>
          <TabsList aria-label="Project sections">
            {overviewTabs.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
          {overviewTabs.map((tab) => (
            <TabsPanel key={tab.value} value={tab.value}>
              <div className="cards-grid">
                {tab.stepIds.map((stepId) => {
                  const step = stepById.get(stepId);
                  return step ? <StepCard key={step.id} step={step} /> : null;
                })}
              </div>
            </TabsPanel>
          ))}
        </Tabs>
      </Panel>

      <Panel
        eyebrow="At a glance"
        title="Workspace stats"
        description="High-level counts pulled from the active project document."
      >
        <dl className="stats-grid">
          <div>
            <dt>Devices</dt>
            <dd>{currentProject.components.length}</dd>
          </div>
          <div>
            <dt>Saved connections</dt>
            <dd>{currentProject.connections.length}</dd>
          </div>
          <div>
            <dt>Issues</dt>
            <dd>{totalIssues}</dd>
          </div>
          <div>
            <dt>Errors / Warnings</dt>
            <dd>
              {errorCount} / {warningCount}
            </dd>
          </div>
        </dl>
      </Panel>
    </div>
  );
}

function StepCard({ step }: { step: ProjectStepProgress }) {
  return (
    <article className={`step-card step-card--${step.status}`}>
      <div className="project-card__header">
        <div>
          <p className="eyebrow">{step.id}</p>
          <h3>{step.label}</h3>
        </div>
        <StatusBadge label={statusBadgeLabel(step.status)} />
      </div>
      <p className="project-card__summary">{step.summary}</p>
      <div className="project-card__actions">
        <Link className="button button--secondary" to={step.href}>
          Open
        </Link>
      </div>
    </article>
  );
}

function getDefaultOverviewTab(
  nextStepId: ProjectStepId | null
): OverviewTabValue {
  return (
    overviewTabs.find((tab) =>
      nextStepId ? tab.stepIds.includes(nextStepId) : false
    )?.value ?? "setup"
  );
}

function statusBadgeLabel(status: string): string {
  switch (status) {
    case "complete":
      return "Valid";
    case "attention":
      return "Needs confirmation";
    case "blocked":
      return "Conflict";
    case "empty":
    default:
      return "Unconnected";
  }
}
