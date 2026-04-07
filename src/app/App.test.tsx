import { render, screen } from "@testing-library/react";
import { App } from "./App";

describe("App", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("renders the projects route by default", async () => {
    render(<App />);
    expect(
      await screen.findByRole("heading", { name: /my projects/i })
    ).toBeInTheDocument();
  });
});
