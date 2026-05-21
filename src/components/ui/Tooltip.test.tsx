import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Button } from "./Button";
import { Tooltip } from "./Tooltip";

describe("Tooltip", () => {
  it("shows content when the trigger receives focus", async () => {
    const user = userEvent.setup();
    render(
      <Tooltip content="Help text">
        <Button>Trigger</Button>
      </Tooltip>
    );

    await user.tab();

    expect(screen.getByRole("button", { name: "Trigger" })).toHaveFocus();
    expect(await screen.findByRole("tooltip")).toHaveTextContent("Help text");
  });

  it("wires aria-describedby from the trigger to the tooltip content", async () => {
    const user = userEvent.setup();
    render(
      <Tooltip content="Mapped target">
        <Button>Open</Button>
      </Tooltip>
    );

    await user.tab();

    const trigger = screen.getByRole("button", { name: "Open" });
    const tooltip = await screen.findByRole("tooltip");

    await waitFor(() => expect(trigger).toHaveAttribute("aria-describedby"));
    expect(trigger).toHaveAttribute("aria-describedby", tooltip.id);
  });
});
