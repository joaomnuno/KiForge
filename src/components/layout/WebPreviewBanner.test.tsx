import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { isTauriRuntime } from "../../lib/runtime";
import { WebPreviewBanner } from "./WebPreviewBanner";

vi.mock("../../lib/runtime", () => ({
  getRuntimeLabel: () => "Web preview",
  isTauriRuntime: vi.fn()
}));

const mockIsTauriRuntime = vi.mocked(isTauriRuntime);

describe("WebPreviewBanner", () => {
  beforeEach(() => {
    mockIsTauriRuntime.mockReturnValue(false);
  });

  it("renders the web preview notice outside Tauri", () => {
    render(<WebPreviewBanner />);

    expect(
      screen.getByRole("status", { name: "Web preview notice" })
    ).toBeInTheDocument();
    expect(screen.getByText("Web preview")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Exports and writes to disk are disabled. Open the desktop app to use them."
      )
    ).toBeInTheDocument();
  });

  it("does not render inside Tauri", () => {
    mockIsTauriRuntime.mockReturnValue(true);

    render(<WebPreviewBanner />);

    expect(
      screen.queryByRole("status", { name: "Web preview notice" })
    ).not.toBeInTheDocument();
  });
});
