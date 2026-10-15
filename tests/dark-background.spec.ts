import { test, expect } from "@playwright/test";
test("all body model backgrounds blend with their surrounding page on every route", async ({
  page,
}) => {
  for (const route of ["/", "/services", "/industries", "/about", "/quote"]) {
    await page.goto(route);
    const panels = await page
      .locator(".media-assembly")
      .evaluateAll((elements) =>
        elements.map((element) => {
          let parent = element.parentElement,
            surround = "";
          while (parent) {
            const bg = getComputedStyle(parent).backgroundColor;
            if (bg !== "rgba(0, 0, 0, 0)" && bg !== "transparent") {
              surround = bg;
              break;
            }
            parent = parent.parentElement;
          }
          return {
            scene: getComputedStyle(element.querySelector(".relief-housing")!)
              .backgroundColor,
            surround,
            photos: element.querySelectorAll("img,picture").length,
          };
        }),
      );
    for (const panel of panels) {
      expect(panel.scene).toBe("rgb(16, 29, 33)");
      expect(panel.surround).toBe(panel.scene);
      expect(panel.photos).toBe(0);
    }
    await expect(page.getByRole("switch", { name: "Dark theme" })).toHaveCount(
      0,
    );
  }
});
