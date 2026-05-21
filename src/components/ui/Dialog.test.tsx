import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ConfirmDialog, Dialog } from "./Dialog";

describe("Dialog", () => {
  it("renders title + description when open", () => {
    render(
      <Dialog open onOpenChange={() => {}} title="Hello" description="World" />
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Hello")).toBeInTheDocument();
    expect(screen.getByText("World")).toBeInTheDocument();
  });

  it("does not render when closed", () => {
    render(<Dialog open={false} onOpenChange={() => {}} title="Hidden" />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});

describe("ConfirmDialog", () => {
  function Harness({
    onConfirm,
    destructive = false
  }: {
    onConfirm: () => void;
    destructive?: boolean;
  }) {
    const [open, setOpen] = useState(true);
    return (
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Delete project?"
        description="Cannot be undone."
        confirmLabel="Delete"
        destructive={destructive}
        onConfirm={onConfirm}
      />
    );
  }

  it("invokes onConfirm and closes on confirm click", async () => {
    const onConfirm = vi.fn();
    render(<Harness onConfirm={onConfirm} />);
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Delete" }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("closes on cancel click without invoking onConfirm", async () => {
    const onConfirm = vi.fn();
    render(<Harness onConfirm={onConfirm} />);
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onConfirm).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("applies the destructive class to the confirm button when destructive", () => {
    render(<Harness onConfirm={() => {}} destructive />);
    const confirm = screen.getByRole("button", { name: "Delete" });
    expect(confirm.className).toContain("button--destructive");
  });
});
