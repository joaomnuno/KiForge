import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuSeparator
} from "./DropdownMenu";

describe("DropdownMenu", () => {
  it("opens when the trigger is clicked", async () => {
    const user = userEvent.setup();

    render(
      <DropdownMenu trigger={<button type="button">Account</button>}>
        <DropdownMenuItem>Preferences</DropdownMenuItem>
      </DropdownMenu>
    );

    await user.click(screen.getByRole("button", { name: "Account" }));

    expect(screen.getByRole("menu")).toBeInTheDocument();
    expect(
      screen.getByRole("menuitem", { name: "Preferences" })
    ).toBeInTheDocument();
  });

  it("fires item onSelect", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();

    render(
      <DropdownMenu trigger={<button type="button">Account</button>}>
        <DropdownMenuItem onSelect={onSelect}>Preferences</DropdownMenuItem>
      </DropdownMenu>
    );

    await user.click(screen.getByRole("button", { name: "Account" }));
    await user.click(screen.getByRole("menuitem", { name: "Preferences" }));

    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it("closes after an item is selected", async () => {
    const user = userEvent.setup();

    render(
      <DropdownMenu trigger={<button type="button">Account</button>}>
        <DropdownMenuItem>Preferences</DropdownMenuItem>
      </DropdownMenu>
    );

    await user.click(screen.getByRole("button", { name: "Account" }));
    await user.click(screen.getByRole("menuitem", { name: "Preferences" }));

    await waitFor(() => {
      expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    });
  });

  it("applies destructive item class", async () => {
    const user = userEvent.setup();

    render(
      <DropdownMenu trigger={<button type="button">Account</button>}>
        <DropdownMenuItem destructive>Delete</DropdownMenuItem>
      </DropdownMenu>
    );

    await user.click(screen.getByRole("button", { name: "Account" }));

    expect(
      screen.getByRole("menuitem", { name: "Delete" }).className
    ).toContain("dropdown-menu__item--destructive");
  });

  it("renders separators through the wrapper", async () => {
    const user = userEvent.setup();

    render(
      <DropdownMenu trigger={<button type="button">Account</button>}>
        <DropdownMenuItem>Preferences</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem>Sign out</DropdownMenuItem>
      </DropdownMenu>
    );

    await user.click(screen.getByRole("button", { name: "Account" }));

    expect(screen.getByRole("separator")).toBeInTheDocument();
  });
});
