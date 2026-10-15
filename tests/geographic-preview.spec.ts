import { test, expect } from "@playwright/test";
import fs from "node:fs";
for (const width of [1920, 1440, 390])
  test(`globe preview ${width}`, async ({ page }) => {
    test.setTimeout(120000);
    await page.setViewportSize({ width, height: width === 390 ? 844 : width === 1920 ? 1080 : 1000 });
    await page.emulateMedia({ reducedMotion: "no-preference" });
    fs.mkdirSync("docs/screenshots", { recursive: true });
    for (const route of ["services", "industries", "about", "quote"]) {
      await page.goto("/" + route + "/");
      await page
        .locator("#page-opening")
        .evaluate((el) =>
          scrollTo({
            top:
              el.getBoundingClientRect().top +
              scrollY +
              (el.clientHeight - innerHeight) * 0.96,
            behavior: "instant",
          }),
        );
      await expect(page.locator("#page-opening")).toHaveAttribute(
        "data-ready",
        "true",
        { timeout: 25000 },
      );
      await page.waitForTimeout(2200);
      await expect(page.locator(".opening-scroll-cue")).toBeVisible();
      await page.screenshot({
        path: `docs/screenshots/globe-${route}-${width}.png`,
      });
    }
  });
