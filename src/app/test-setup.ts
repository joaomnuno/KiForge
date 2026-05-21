import "@testing-library/jest-dom/vitest";

class TestResizeObserver {
  constructor() {}

  observe() {}

  unobserve() {}

  disconnect() {}
}

if (typeof globalThis.ResizeObserver === "undefined") {
  globalThis.ResizeObserver =
    TestResizeObserver as unknown as typeof ResizeObserver;
}
