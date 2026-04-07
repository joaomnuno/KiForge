import { render, screen } from "@testing-library/react";
import { App } from "./App";

describe("App", () => {
  it("renders the projects route by default", () => {
    render(<App />);
    expect(
      screen.getByRole("heading", { name: /my projects/i })
    ).toBeInTheDocument();
  });
});
