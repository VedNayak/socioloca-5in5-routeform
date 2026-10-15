import { test, expect } from "@playwright/test";
import sharp from "sharp";
import fs from "node:fs";
for (const width of [1440, 390])
  test(`settled heading glyphs remain unclipped at ${width}px`, async ({
    page,
  }) => {
    test.setTimeout(120000);
    await page.setViewportSize({ width, height: 1000 });
    await page.emulateMedia({ reducedMotion: "no-preference" });
    for (const route of [
      "/",
      "/services",
      "/industries",
      "/about",
      "/quote",
      "/about#concept",
    ]) {
      await page.goto(route);
      const selector = route.includes("#")
        ? ".concept-disclosure h2"
        : route === "/"
          ? ".intro-text h2"
          : route === "/quote"
            ? ".quote-intro h2"
            : ".page-intro-main h2";
      const heading = page.locator(selector);
      await heading.scrollIntoViewIfNeeded();
      await expect(heading).toHaveClass(/heading-lit/);
      await page.waitForTimeout(2300);
      const box = await heading.boundingBox();
      if (!box) throw new Error("Heading missing");
      const clip = {
        x: Math.max(0, box.x - 12),
        y: Math.max(0, box.y - 18),
        width: Math.min(width - Math.max(0, box.x - 12), box.width + 24),
        height: Math.min(1000 - Math.max(0, box.y - 18), box.height + 36),
      };
      fs.mkdirSync("docs/screenshots", { recursive: true });
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth),
      ).toBeLessThanOrEqual(width + 1);
      const beforeShot = await page.screenshot({ clip });
      if (route.includes("#"))
        await page.screenshot({
          path: `docs/screenshots/heading-clearance-${width}.png`,
        });
      const before = await sharp(beforeShot).removeAlpha().raw().toBuffer();
      await heading.evaluate((el) => {
        el.style.clipPath = "none";
        el.style.overflow = "visible";
        el.querySelectorAll<HTMLElement>(".type-mask").forEach(
          (e) => (e.style.overflow = "visible"),
        );
      });
      const unmasked = await sharp(await page.screenshot({ clip }))
        .removeAlpha()
        .raw()
        .toBuffer();
      let clipped = 0;
      for (let i = 0; i < before.length; i++)
        if (Math.abs(before[i] - unmasked[i]) > 16) clipped++;
      expect(
        clipped / before.length,
        route + " clips glyphs at its animation masks",
      ).toBeLessThan(0.0005);
      await heading.evaluate((el) =>
        el.querySelectorAll<HTMLElement>(".type-word").forEach((e) => {
          e.style.background = "none";
          e.style.webkitTextFillColor = "currentColor";
        }),
      );
      const native = await sharp(await page.screenshot({ clip }))
        .removeAlpha()
        .raw()
        .toBuffer();
      let missing = 0,
        ink = 0;
      // Native and background-clipped text use different antialiasing. Compare
      // solid native strokes against empty background, not their edge colours.
      for (let i = 0; i < before.length; i += 3)
        if (native[i] > 180 && native[i + 1] > 180 && native[i + 2] > 170) {
          ink++;
          if (Math.max(before[i], before[i + 1], before[i + 2]) < 85) missing++;
        }
      expect(
        missing / Math.max(1, ink),
        route + " loses solid glyph strokes in the text gradient",
      ).toBeLessThan(0.005);
      if (route.includes("#")) {
        const gap = await page.evaluate(
          () =>
            document.querySelector(".disclosure-grid")!.getBoundingClientRect()
              .top -
            document
              .querySelector(".concept-disclosure h2")!
              .getBoundingClientRect().bottom,
        );
        const intended=await heading.evaluate(el=>parseFloat(getComputedStyle(el).marginBottom));
        expect(gap).toBeGreaterThanOrEqual(24);
        expect(Math.abs(gap-intended)).toBeLessThan(1);
      }
    }
  });
