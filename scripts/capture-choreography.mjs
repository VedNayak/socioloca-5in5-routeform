import { chromium, expect } from "@playwright/test";
import sharp from "sharp";
import { mkdir, writeFile } from "node:fs/promises";
const origin = process.env.TEST_URL || "http://127.0.0.1:4197";
const b = await chromium.launch({ channel: "chrome" });
const page = await b.newPage({
  viewport: { width: 1440, height: 1000 },
  reducedMotion: "no-preference",
});
const tiles = [],
  reports = [],
  errors = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => {
  if (m.type() === "error") errors.push(m.text());
});
await mkdir("docs/screenshots/v7", { recursive: true });
for (const width of [1440, 390]) {
  await page.setViewportSize({ width, height: width === 1440 ? 1000 : 844 });
  for (const route of ["services", "industries", "about", "quote"]) {
    const response = await page.goto(origin + "/" + route);
    await page.evaluate(() => document.fonts.ready);
    if (width > 820)
      await expect
        .poll(() => page.locator("video").evaluate((v) => v.readyState), {
          timeout: 15000,
        })
        .toBeGreaterThanOrEqual(2);
    for (const progress of width === 1440
      ? [0.19, 0.55, 0.69, 0.8, 0.96]
      : [0.69, 0.96]) {
      await page.locator("#page-opening").evaluate(
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
      await expect(page.locator(".opening-geometry")).toHaveAttribute(
        "data-geometry",
        "volumetric",
        { timeout: 25000 },
      );
      if (progress === 0.96) {
        await expect(page.locator(".opening-geometry")).toHaveAttribute(
          "data-explosion",
          "1.000",
        );
        await expect(page.locator(".opening-geometry")).toHaveAttribute(
          "data-particle-connection",
          "1.000",
        );
      }
      // Start in normal motion to exercise first-frame path initialization,
      // then freeze the sequence for reproducible comparison captures.
      if (
        await page.getByRole("button", { name: "Pause opening motion" }).count()
      )
        await page
          .getByRole("button", { name: "Pause opening motion" })
          .click();
      await page.waitForTimeout(1600);
      const file = `docs/screenshots/v7/${width}-${route}-${progress}.png`;
      await page.screenshot({ path: file });
      if (width === 1440)
        tiles.push({
          input: await sharp(file).resize(360, 250).toBuffer(),
          left: (tiles.length % 5) * 360,
          top: Math.floor(tiles.length / 5) * 250,
        });
    }
    await page.getByRole("button", { name: "Play opening motion" }).click();
    await page.waitForTimeout(600);
    reports.push({
      width,
      route,
      status: response.status(),
      scene: await page
        .locator(".opening-geometry")
        .evaluate((el) => ({ ...el.dataset })),
      overflow: await page.evaluate(
        () => document.documentElement.scrollWidth - innerWidth,
      ),
    });
  }
}
await b.close();
await sharp({
  create: { width: 1800, height: 1000, channels: 3, background: "#101d21" },
})
  .composite(tiles)
  .webp({ quality: 86 })
  .toFile("docs/opening-choreography-preview.webp");
await writeFile(
  "docs/choreography-smoke-v7.json",
  JSON.stringify({ origin, errors, reports }, null, 2),
);
console.log(JSON.stringify({ errors, reports }));
if (errors.length || reports.some((r) => r.status !== 200 || r.overflow > 1))
  process.exitCode = 1;
