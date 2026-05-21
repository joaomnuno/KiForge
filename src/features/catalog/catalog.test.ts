import { catalog } from "./catalog";

describe("catalog", () => {
  it("loads controllers and categories from local JSON files", () => {
    expect(catalog.controllers.map((controller) => controller.id)).toEqual([
      "esp32-s3",
      "rp2040",
      "stm32f405rg",
      "stm32g0b1cb",
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
