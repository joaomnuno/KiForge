import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Tabs, TabsList, TabsPanel, TabsTrigger } from "./Tabs";

function renderTabs({
  forceMount = false,
  activationMode
}: {
  forceMount?: boolean;
  activationMode?: "automatic" | "manual";
} = {}) {
  const panelProps = forceMount ? { forceMount: true as const } : {};

  return render(
    <Tabs defaultValue="setup" activationMode={activationMode}>
      <TabsList aria-label="Project sections">
        <TabsTrigger value="setup">Setup</TabsTrigger>
        <TabsTrigger value="connectivity">Connectivity</TabsTrigger>
        <TabsTrigger value="output">Output</TabsTrigger>
      </TabsList>
      <TabsPanel value="setup" {...panelProps}>
        Setup panel
      </TabsPanel>
      <TabsPanel value="connectivity" {...panelProps}>
        Connectivity panel
      </TabsPanel>
      <TabsPanel value="output" {...panelProps}>
        Output panel
      </TabsPanel>
    </Tabs>
  );
}

describe("Tabs", () => {
  it("renders the default panel", () => {
    renderTabs();

    expect(screen.getByRole("tabpanel", { name: "Setup" })).toHaveTextContent(
      "Setup panel"
    );
    expect(screen.queryByText("Connectivity panel")).not.toBeInTheDocument();
  });

  it("swaps the visible panel when a trigger is clicked", async () => {
    renderTabs();
    const user = userEvent.setup();

    await user.click(screen.getByRole("tab", { name: "Connectivity" }));

    expect(
      screen.getByRole("tabpanel", { name: "Connectivity" })
    ).toHaveTextContent("Connectivity panel");
    expect(screen.queryByText("Setup panel")).not.toBeInTheDocument();
  });

  it("moves focus with arrow keys", async () => {
    renderTabs({ activationMode: "manual" });
    const user = userEvent.setup();
    const setupTrigger = screen.getByRole("tab", { name: "Setup" });
    const connectivityTrigger = screen.getByRole("tab", {
      name: "Connectivity"
    });

    setupTrigger.focus();
    await user.keyboard("{ArrowRight}");

    expect(connectivityTrigger).toHaveFocus();
  });

  it("labels each panel from its corresponding trigger", () => {
    renderTabs({ forceMount: true });

    for (const [panelText, triggerName] of [
      ["Setup panel", "Setup"],
      ["Connectivity panel", "Connectivity"],
      ["Output panel", "Output"]
    ] as const) {
      const panel = screen.getByText(panelText).closest('[role="tabpanel"]');
      const labelledBy = panel?.getAttribute("aria-labelledby");
      const trigger = labelledBy ? document.getElementById(labelledBy) : null;

      expect(panel).toBeInTheDocument();
      expect(trigger).toHaveAttribute("role", "tab");
      expect(trigger).toHaveAccessibleName(triggerName);
    }
  });
});
