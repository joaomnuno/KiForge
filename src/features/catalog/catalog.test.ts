import { catalog } from "./catalog";

describe("catalog", () => {
  it("loads controllers and categories from local JSON files", () => {
    expect(catalog.controllers.map((controller) => controller.id)).toEqual([
      "rp2040",
      "stm32f405rg",
      "stm32h743zi"
    ]);

    expect(catalog.categories.map((category) => category.id)).toEqual([
      "communications",
      "debug",
      "memories",
      "sensors"
    ]);
  });
});
