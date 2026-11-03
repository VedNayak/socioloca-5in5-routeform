import { heroStoryProgress } from "../src/hero-pacing";
import { test, expect } from "@playwright/test";
for (const width of [320, 390, 768, 1440]) {
  test(`hero responds to the first small scroll at ${width}px`, async ({
    page,
  }) => {
    test.setTimeout(150000);
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: "no-preference" });
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    for (const route of ["", "services", "industries", "about", "quote"]) {
      await page.goto("/" + route);
      const home = !route,
        section = page.locator(home ? "#movement" : "#page-opening"),
        graphics = page.locator(home ? ".cinema-webgl" : ".opening-geometry");
      // No click or scroll to activate: the visible scene prepares while reading.
      await expect(section).toHaveAttribute(
        home ? "data-render-mode" : "data-ready",
        home ? "webgl" : "true",
        { timeout: 30000 },
      );
      const offset = width < 821 ? (home ? 96 : 100) : 0;
      const range = await section.evaluate(
        (el, offset) => ({
          start: scrollY + el.getBoundingClientRect().top - offset,
          travel: el.clientHeight - innerHeight + offset,
        }),
        offset,
      );
      expect(range.travel / 900).toBeLessThan(width < 821 ? 1.8 : 2.15);
      await page.evaluate(
        (y) => scrollTo({ top: y, behavior: "instant" }),
        range.start,
      );
      await expect
        .poll(async () =>
          Number(
            await (home ? section : graphics).getAttribute("data-progress"),
          ),
        )
        .toBeLessThan(0.01);
      await page.mouse.move(width / 2, 450);
      await page.mouse.wheel(0, 90);
      await expect
        .poll(
          async () =>
            Number(await graphics.getAttribute("data-reveal-progress")),
          { timeout: 1500 },
        )
        .toBeGreaterThan(0.08);
      await expect
        .poll(async () =>
          Number(
            await (home ? section : graphics).getAttribute("data-progress"),
          ),
        )
        .toBeGreaterThan(0.35);
      const progress = Number(
        await (home ? section : graphics).getAttribute("data-progress"),
      );
      expect(progress).toBeLessThan(0.5);
      for (const p of [0.5, 0.96, 0.05]) {
        await page.evaluate(
          ({ start, travel, p }) =>
            scrollTo({ top: start + travel * p, behavior: "instant" }),
          { ...range, p },
        );
        await expect
          .poll(async () =>
            Number(
              await (home ? section : graphics).getAttribute("data-progress"),
            ),
          )
          .toBeCloseTo(heroStoryProgress(p), 1);
        await expect(graphics).toHaveAttribute(
          "data-particle-opacity",
          "0.000",
        );
        if (p === 0.5 && width === 390)
          await page.screenshot({
            path: `docs/screenshots/hero-pacing-${route || "home"}-mid.png`,
          });
      }
      await page.evaluate(
        (y) => scrollTo({ top: y, behavior: "instant" }),
        range.start + range.travel + 180,
      );
      expect(
        await section
          .locator(home ? ".cinema-frame" : ".opening-frame")
          .evaluate((el) => el.getBoundingClientRect().top),
      ).toBeLessThan(offset - 100);
    }
    expect(errors).toEqual([]);
  });
}
test("reduced motion skips the scroll-pinned graphics", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const route of ["", "services", "industries", "about", "quote"]) {
    await page.goto("/" + route);
    await expect(
      page.locator(".opening-geometry canvas, .cinema-webgl canvas"),
    ).toHaveCount(0);
    await expect(
      page.locator(route ? "#page-opening" : "#movement"),
    ).not.toHaveClass(/(?:opening|cinema)-enhanced/);
  }
});
