import { MemoryRouter, Route, Routes } from "react-router-dom";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { LibraryPage } from "./LibraryPage";

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/library" element={<LibraryPage />} />
      </Routes>
    </MemoryRouter>
  );
}

describe("LibraryPage", () => {
  it("renders the page heading and a summary of the catalog size", () => {
    renderAt("/library");
    expect(
      screen.getByRole("heading", { level: 1, name: "Library" })
    ).toBeInTheDocument();
    // Summary chip text within the page hero.
    expect(
      screen.getByText((_, el) => el?.textContent === "5 controllers")
    ).toBeInTheDocument();
    expect(screen.getAllByText(/components/).length).toBeGreaterThan(0);
  });

  it("lists every controller catalog entry by name", () => {
    renderAt("/library");
    expect(screen.getByText("STM32F405RG")).toBeInTheDocument();
    expect(screen.getByText("STM32H743ZI")).toBeInTheDocument();
    expect(screen.getByText("RP2040")).toBeInTheDocument();
  });

  it("starts with the All category active and shows components from multiple categories", () => {
    renderAt("/library");
    expect(screen.getByRole("button", { name: "All" }).className).toContain(
      "filter-pill--active"
    );
    // Sensor + Communications + Memory parts all present in default catalog.
    expect(screen.getByText("BMP388")).toBeInTheDocument();
    expect(screen.getByText("CH340K")).toBeInTheDocument();
    expect(screen.getByText("W25Q128JV")).toBeInTheDocument();
  });

  it("filters by search text", async () => {
    renderAt("/library");
    const user = userEvent.setup();
    await user.type(
      screen.getByPlaceholderText(/Search by name, package, protocol/i),
      "bmp"
    );
    expect(screen.getByText("BMP388")).toBeInTheDocument();
    expect(screen.queryByText("CH340K")).not.toBeInTheDocument();
  });

  it("shows an empty-state message when filter + search match nothing", async () => {
    renderAt("/library");
    const user = userEvent.setup();
    await user.type(
      screen.getByPlaceholderText(/Search by name, package, protocol/i),
      "nonexistentpartxyz"
    );
    expect(screen.getByText(/No components match/i)).toBeInTheDocument();
  });
});
