import { MemoryRouter } from "react-router-dom";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { AppScaffold } from "./AppScaffold";

describe("AppScaffold search", () => {
  it("renders unsupported toolbar search as read-only when page search props are omitted", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <AppScaffold activeNav="library">
          <p>Library content</p>
        </AppScaffold>
      </MemoryRouter>
    );

    const search = screen.getByRole("searchbox", {
      name: /search unavailable/i
    });
    expect(search).toHaveAttribute(
      "placeholder",
      "Search is per-page; only Projects supports it today."
    );
    expect(search).toHaveProperty("readOnly", true);

    await user.type(search, "stm32");
    expect(search).toHaveValue("");
  });
});
