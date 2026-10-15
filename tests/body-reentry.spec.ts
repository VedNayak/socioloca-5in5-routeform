import { test, expect } from "@playwright/test";
import sharp from "sharp";
import { bodyStudies } from "../src/freight/body-studies";
test.use({ reducedMotion: "no-preference" });
for (const width of [1440, 390])
  test(`all body views preserve their rendered appearance on reentry at ${width}px`, async ({
    page,
  }) => {
    test.setTimeout(240000);
    await page.setViewportSize({ width, height: 900 });
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    for (const route of ["home", "services", "industries", "about"]) {
      await page.goto(route === "home" ? "/" : `/${route}/#intro`);
      for (const id of Object.keys(bodyStudies).filter((s) =>
        s.startsWith(route + "-"),
      )) {
        const figure = page.locator(`[data-study="${id}"]`),
          host = figure.locator(".assembly-host");
        await figure.evaluate((el) =>
          scrollTo({
            top: scrollY + el.getBoundingClientRect().top - 150,
            behavior: "instant",
          }),
        );
        await expect(figure).toHaveClass(/relief-ready/, { timeout: 30000 });
        await figure
          .getByRole("button", { name: "Pause working animation", exact: true })
          .click();
        await page.waitForTimeout(400);
        const beforeTime = Number(await host.getAttribute("data-work-time"));
        const housing = figure.locator(".relief-housing");
        await housing.screenshot({
          path: `docs/screenshots/entry-${width}-${id}-static.png`,
        });
        const before = await sharp(await housing.screenshot())
          .resize(480, 320)
          .removeAlpha()
          .raw()
          .toBuffer();
        // Leave the viewport and its warm-up region so the WebGL lease is released.
        await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
        await expect(host.locator("canvas")).toHaveCount(0);
        const poster = figure.locator(".assembly-poster-compact");
        await expect(poster).toHaveAttribute("src", /^data:image\/webp/);
        await figure.evaluate((el) =>
          scrollTo({
            top: scrollY + el.getBoundingClientRect().top - 150,
            behavior: "instant",
          }),
        );
        await expect(figure).toHaveClass(/relief-ready/, { timeout: 30000 });
        expect(Number(await host.getAttribute("data-work-time"))).toBeCloseTo(
          beforeTime,
          1,
        );
        await page.waitForTimeout(1300);
        await housing.screenshot({
          path: `docs/screenshots/entry-${width}-${id}-live.png`,
        });
        const after = await sharp(await housing.screenshot())
          .resize(480, 320)
          .removeAlpha()
          .raw()
          .toBuffer();
        const mean =
          before.reduce((sum, v, i) => sum + Math.abs(v - after[i]), 0) /
          before.length;
        expect(
          mean,
          `${id}: paused lit frame should survive disposal and reentry`,
        ).toBeLessThan(1.5);
        await housing.screenshot({
          path: `docs/screenshots/reentry-${width}-${id}.png`,
        });
      }
    }
    expect(errors).toEqual([]);
  });
for (const width of [1440, 390])
  test(`first lit frame matches the static model preview at ${width}px`, async ({
    page,
  }) => {
    test.setTimeout(180000);
    // Set the real pause controls as soon as they mount, before offscreen warm-up.
    await page.addInitScript(() => {
      const seen = new WeakSet<Element>();
      new MutationObserver(() => {
        document
          .querySelectorAll<HTMLButtonElement>(
            '.media-assembly button[aria-label="Pause working animation"]',
          )
          .forEach((button) => {
            if (!seen.has(button)) {
              seen.add(button);
              button.click();
            }
          });
      }).observe(document, { childList: true, subtree: true });
    });

    await page.setViewportSize({ width, height: 900 });
    for (const route of ["home", "services", "industries", "about"])
      for (const id of Object.keys(bodyStudies).filter((s) =>
        s.startsWith(route + "-"),
      )) {
        await page.mouse.move(0, 0);
        await page.emulateMedia({ reducedMotion: "reduce" });
        await page.goto(route === "home" ? "/" : `/${route}/#intro`);
        const figure = page.locator(`[data-study="${id}"]`),
          housing = figure.locator(".relief-housing");
        await figure.evaluate((el) =>
          scrollTo({
            top: scrollY + el.getBoundingClientRect().top - 150,
            behavior: "instant",
          }),
        );
        await figure
          .locator(".assembly-poster")
          .evaluateAll((els) =>
            Promise.all(els.map((el) => (el as HTMLImageElement).decode())),
          );
        await housing.screenshot({
          path: `docs/screenshots/entry-${width}-${id}-static.png`,
        });
        // Suppress subpixel grid/edge rasterization differences between a scaled
        // WebP and native WebGL; retain the strict colour/shape difference bound.
        const before = await sharp(await housing.screenshot())
          .resize(480, 320)
          .blur(1.2)
          .removeAlpha()
          .raw()
          .toBuffer();
        await page.emulateMedia({ reducedMotion: "no-preference" });
        await expect(
          figure.getByRole("button", {
            name: "Play working animation",
            exact: true,
          }),
        ).toHaveAttribute("aria-pressed", "true");
        // Changing motion preferences rebuilds scroll choreography; restore the target.
        await figure.evaluate((el) =>
          scrollTo({
            top: scrollY + el.getBoundingClientRect().top - 150,
            behavior: "instant",
          }),
        );
        await expect(figure).toHaveClass(/relief-ready/, { timeout: 30000 });
        expect(
          Number(
            await figure
              .locator(".assembly-host")
              .getAttribute("data-work-time"),
          ),
        ).toBeLessThan(0.2);
        await page.waitForTimeout(1300);
        await housing.screenshot({
          path: `docs/screenshots/entry-${width}-${id}-live.png`,
        });
        const after = await sharp(await housing.screenshot())
          .resize(480, 320)
          .blur(1.2)
          .removeAlpha()
          .raw()
          .toBuffer();
        const mean =
          before.reduce((sum, v, i) => sum + Math.abs(v - after[i]), 0) /
          before.length;
        expect(
          mean,
          `${id}: static-to-live handoff should retain material, camera and scale`,
        ).toBeLessThan(3);
      }
  });
