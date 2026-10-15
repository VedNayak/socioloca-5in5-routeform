import { test, expect } from "@playwright/test";
import sharp from "sharp";
import { bodyStudies } from "../src/freight/body-studies";

test.use({ reducedMotion: "no-preference" });
for (const width of [1440, 390])
  for (const route of ["home", "services", "industries", "about"]) {
    test(`${route} distinct working studies at ${width}px`, async ({
      page,
    }) => {
      test.setTimeout(180000);
      await page.setViewportSize({
        width,
        height: width === 1440 ? 1000 : 844,
      });
      const errors: string[] = [];
      page.on("pageerror", (e) => errors.push(e.message));
      page.on("console", (m) => {
        if (m.type() === "error") errors.push(m.text());
      });
      await page.goto(route === "home" ? "/" : `/${route}/#intro`);
      const expected = Object.keys(bodyStudies).filter((id) =>
        id.startsWith(route + "-"),
      );
      expect(
        (
          await page
            .locator(".media-assembly")
            .evaluateAll((els) =>
              els.map((el) => (el as HTMLElement).dataset.study),
            )
        ).sort(),
      ).toEqual(expected.sort());
      for (const id of expected) {
        const figure = page.locator(`[data-study="${id}"]`),
          host = figure.locator(".assembly-host");
        await figure.evaluate((el) => {
          const r = el.getBoundingClientRect();
          scrollTo({
            top: scrollY + r.top - (innerHeight - r.height) / 2,
            behavior: "instant",
          });
        });
        await figure
          .getByRole("button", { name: "Reset object camera" })
          .click();
        await expect(figure).toHaveClass(/relief-ready/, { timeout: 30000 });
        await expect(page.locator(".assembly-host canvas")).toHaveCount(1);
        await expect
          .poll(async () => Number(await host.getAttribute("data-work-time")), {
            timeout: 15000,
          })
          .toBeGreaterThan(3);
        const before = await host.screenshot();
        await page.waitForTimeout(2000);
        const after = await host.screenshot();
        const a = await sharp(before)
            .resize(400, 260)
            .removeAlpha()
            .raw()
            .toBuffer(),
          b = await sharp(after)
            .resize(400, 260)
            .removeAlpha()
            .raw()
            .toBuffer();
        const change =
          a.reduce((sum, v, i) => sum + Math.abs(v - b[i]), 0) / a.length;
        expect(change, `${id} should visibly work`).toBeGreaterThan(0.03);
        await figure
          .getByRole("button", { name: "Pause working animation" })
          .click();
        const t = Number(await host.getAttribute("data-work-time"));
        await page.waitForTimeout(300);
        expect(
          Number(await host.getAttribute("data-work-time")) - t,
        ).toBeLessThan(0.1);
        await figure.screenshot({
          path: `docs/screenshots/precision-${width}-${id}.png`,
        });
        await figure
          .getByRole("button", { name: "Toggle technical view" })
          .click();
        await expect
          .poll(async () => Number(await host.getAttribute("data-technical")))
          .toBeGreaterThan(0.98);
        await figure.screenshot({
          path: `docs/screenshots/precision-${width}-${id}-technical.png`,
        });
        await host.focus();
        await page.keyboard.press("ArrowRight");
        await expect
          .poll(async () => Number(await host.getAttribute("data-camera-yaw")))
          .toBeGreaterThan(0.05);
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth + 1,
          ),
        ).toBe(true);
      }
      expect(errors).toEqual([]);
    });
  }

test("all body fallbacks are distinct and heroes retain their renderers", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const seen: string[] = [];
  for (const route of [
    "/",
    "/services/",
    "/industries/",
    "/about/",
    "/quote/",
  ]) {
    await page.goto(route);
    for (const figure of await page.locator(".media-assembly").all()) {
      const id = await figure.getAttribute("data-study");
      expect(seen).not.toContain(id);
      seen.push(id!);
      const href = await figure.locator("use").getAttribute("href");
      const response = await page.request.get(href!.split("#")[0]);
      expect(response.ok()).toBe(true);
      expect(await response.text()).toContain('id="study"');
    }
    await expect(page.locator(".assembly-host canvas")).toHaveCount(0);
  }
  expect(seen).toHaveLength(15);
});
