import { test, expect } from "@playwright/test";
import sharp from "sharp";

for (const [width, height] of [
  [320, 844],
  [390, 667],
  [768, 1024],
]) {
  test(`final spatial subjects clear text and controls at ${width}x${height}`, async ({
    page,
  }) => {
    test.setTimeout(90000);
    await page.setViewportSize({ width, height });
    await page.emulateMedia({ reducedMotion: "no-preference" });
    for (const route of ["services", "industries", "about", "quote"]) {
      await page.goto("/" + route);
      await page.evaluate(() => document.fonts.ready);
      await expect(page.locator("#page-opening")).toHaveClass(
        /opening-enhanced/,
      );
      await page
        .locator("#page-opening")
        .evaluate((el) =>
          scrollTo({
            top:
              el.getBoundingClientRect().top +
              scrollY +
              (el.clientHeight - innerHeight) * 0.86,
            behavior: "instant",
          }),
        );
      await expect(page.locator("#page-opening")).toHaveAttribute(
        "data-ready",
        "true",
        { timeout: 25000 },
      );
      await page.getByRole("button", { name: "Pause opening motion" }).click();
      await page.waitForTimeout(2100);
      const bounds = await page.evaluate(() => {
        const copy = document
          .querySelector('.opening-copy[data-active="true"]')!
          .getBoundingClientRect();
        const controls = document
          .querySelector(".opening-controls")!
          .getBoundingClientRect();
        return {
          copyBottom: copy.bottom,
          controlsTop: controls.top,
          viewportWidth: innerWidth,
          viewportHeight: innerHeight,
        };
      });
      const a = await sharp(await page.screenshot())
        .removeAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });
      await page
        .locator(".opening-geometry canvas")
        .evaluate((el) => ((el as HTMLElement).style.visibility = "hidden"));
      const b = await sharp(await page.screenshot())
        .removeAlpha()
        .raw()
        .toBuffer();
      let first = bounds.viewportHeight,
        last = 0,
        count = 0;
      // Windows WebKit reports a CSS viewport smaller than the requested
      // screenshot size at fractional OS scaling. Compare in CSS coordinates.
      const scale = a.info.width / bounds.viewportWidth;
      for (let y = 0; y < a.info.height; y++)
        for (let x = 0; x < a.info.width; x++) {
          const i = (y * a.info.width + x) * 3;
          if (
            Math.max(
              Math.abs(a.data[i] - b[i]),
              Math.abs(a.data[i + 1] - b[i + 1]),
              Math.abs(a.data[i + 2] - b[i + 2]),
            ) > 14
          ) {
            first = Math.min(first, y / scale);
            last = Math.max(last, y / scale);
            count++;
          }
        }
      expect(
        count,
        route + " must render a visible dimensional subject",
      ).toBeGreaterThan(200);
      expect(
        first,
        route + " geometry must clear the active text",
      ).toBeGreaterThan(bounds.copyBottom + 6);
      expect(last, route + " geometry must clear the controls").toBeLessThan(
        bounds.controlsTop - 6,
      );
    }
  });
}
