import { test, expect } from "@playwright/test";
import fs from "node:fs";
for (const width of [1440, 390])
  test(`complete visual sweep ${width}`, async ({ page }) => {
    test.setTimeout(420000);
    await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
    await page.emulateMedia({ reducedMotion: "no-preference" });
    const dir = `docs/screenshots/final-pass-${width}`;
    fs.mkdirSync(dir, { recursive: true });
    const records = [];
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    for (const route of ["", "services", "industries", "about", "quote"]) {
      await page.goto("/" + route);
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(1200);
      const slug = route || "home";
      await page.screenshot({ path: `${dir}/${slug}-00-opening.png` });
      await page.mouse.wheel(0, 160);
      const opening = page.locator(route ? "#page-opening" : "#movement");
      await expect(opening).toHaveClass(
        route ? /opening-enhanced/ : /cinema-enhanced/,
      );
      await expect(opening).toHaveAttribute(
        route ? "data-ready" : "data-render-mode",
        route ? "true" : "webgl",
        { timeout: 30000 },
      );
      for (const [name, progress] of [
        ["structure", route ? 0.48 : 0.4],
        ["final", 0.96],
      ] as const) {
        await opening.evaluate(
          (el, p) =>
            scrollTo({
              top:
                el.getBoundingClientRect().top +
                scrollY +
                (el.clientHeight - innerHeight) * p,
              behavior: "instant",
            }),
          progress,
        );
        await expect(opening.locator("canvas").first()).toBeVisible({
          timeout: 30000,
        });
        await page.waitForTimeout(1500);
        await page.screenshot({ path: `${dir}/${slug}-01-${name}.png` });
      }
      const sections = page.locator(
        "main > section:not(#movement):not(#page-opening),main > .service-editorials > article,main .industry-story,main .quote-workbench,main > footer",
      );
      for (let i = 0; i < (await sections.count()); i++) {
        const s = sections.nth(i);
        if (!(await s.isVisible())) continue;
        await s.evaluate((el) =>
          scrollTo({
            top: el.getBoundingClientRect().top + scrollY - 130,
            behavior: "instant",
          }),
        );
        await page.waitForTimeout(1400);
        const box = await s.boundingBox();
        if (!box) continue;
        const title = (
          await s
            .locator("h2,h3")
            .first()
            .textContent()
            .catch(() => "")
        )?.trim();
        await page.screenshot({
          path: `${dir}/${slug}-${String(i + 2).padStart(2, "0")}-section.png`,
        });
        if (box.height > innerHeightSafe(width) * 1.3) {
          await s.evaluate((el) =>
            scrollTo({
              top:
                el.getBoundingClientRect().bottom + scrollY - innerHeight + 40,
              behavior: "instant",
            }),
          );
          await page.waitForTimeout(700);
          await page.screenshot({
            path: `${dir}/${slug}-${String(i + 2).padStart(2, "0")}-detail.png`,
          });
        }
        const over = await page.evaluate(
          () => document.documentElement.scrollWidth - innerWidth,
        );
        expect(over, `${slug} ${title} overflow`).toBeLessThanOrEqual(1);
        records.push({ route: slug, title, height: Math.round(box.height) });
      }
      await page.locator("footer").last().scrollIntoViewIfNeeded();
      await page.waitForTimeout(400);
      await page.screenshot({ path: `${dir}/${slug}-99-footer.png` });
    }
    fs.writeFileSync(
      `docs/final-visual-sweep-${width}.json`,
      JSON.stringify({ width, records, errors }, null, 2),
    );
    expect(errors).toEqual([]);
  });
function innerHeightSafe(width: number) {
  return width === 390 ? 844 : 1000;
}
