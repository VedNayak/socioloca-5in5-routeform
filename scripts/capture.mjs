import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
await mkdir("docs/screenshots", { recursive: true });
const browser = await chromium.launch();
const url = process.env.TEST_URL || "http://127.0.0.1:5173";
for (const [label, width, height] of [
  ["desktop", 1440, 1000],
  ["mobile", 390, 844],
]) {
  const page = await browser.newPage({
    viewport: { width, height },
    reducedMotion: "reduce",
  });
  for (const route of ["/", "/services", "/industries", "/about", "/quote"]) {
    await page.goto(url + route);
    await page.evaluate(() => document.fonts.ready);
    for (const img of await page.locator("img").all()) {
      await img.scrollIntoViewIfNeeded();
      await img.evaluate((e) => e.decode().catch(() => {}));
    }
    await page.locator("footer").scrollIntoViewIfNeeded();
    await page.waitForTimeout(500); // Allow the offscreen render/layout to settle.
    if (route === "/")
      await page.screenshot({ path: `docs/screenshots/${label}-footer.png` });
    await page.evaluate(async () => {
      for (const img of document.images) await img.decode().catch(() => {});
      window.scrollTo(0, 0);
    });
    const name = route === "/" ? "home" : route.slice(1);
    await page.screenshot({
      path: `docs/screenshots/${label}-${name}.png`,
      fullPage: true,
    });
    if (route === "/") {
      await page.screenshot({ path: `docs/screenshots/${label}-hero.png` });
      await page
        .locator("#network")
        .screenshot({ path: `docs/screenshots/${label}-network.png` });
    }
    console.log(`Captured ${label} ${route}`);
  }
  await page.close();
}
const versions = { chromium: browser.version() };
await writeFile(
  "docs/screenshots/browser.json",
  JSON.stringify(versions, null, 2),
);
await browser.close();
