// Captures Home and the four internal openings at the same scroll progress
// points and composes docs/home-matched-openings-preview.webp.
// Usage: TEST_URL=http://127.0.0.1:4173 node scripts/capture-home-matched.mjs
// CHROMIUM_PATH selects a specific Chromium build (for example a container's
// preinstalled browser); otherwise Playwright's default Chromium is used.
import { chromium } from "@playwright/test";
import sharp from "sharp";
import { mkdir } from "node:fs/promises";

const origin = process.env.TEST_URL || "http://127.0.0.1:4173";
const points = [0.15, 0.3, 0.45, 0.6, 0.75, 0.9];
const routes = ["", "services", "industries", "about", "quote"];
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH,
  args: ["--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"],
});
const page = await browser.newPage({
  viewport: { width: 1440, height: 900 },
  reducedMotion: "no-preference",
});
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
await mkdir("docs/screenshots/home-matched", { recursive: true });
const tiles = [];
for (const [row, route] of routes.entries()) {
  await page.goto(`${origin}/${route}`);
  await page.evaluate(() => document.fonts.ready);
  const scene = page.locator(route ? "#page-opening" : "#movement");
  // A wheel gesture is the visitor intent that loads graphics on every route.
  await page.mouse.move(720, 450);
  await page.mouse.wheel(0, 40);
  await page.waitForTimeout(3500);
  for (const [column, progress] of points.entries()) {
    await scene.evaluate(
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
    // Allow the 0.55s scrub and a software renderer to settle.
    await page.waitForTimeout(3200);
    const file = `docs/screenshots/home-matched/${route || "home"}-${progress}.png`;
    await page.screenshot({ path: file });
    tiles.push({
      input: await sharp(file).resize(320, 200).toBuffer(),
      left: column * 320,
      top: row * 200,
    });
  }
}
await sharp({
  create: {
    width: 320 * points.length,
    height: 200 * routes.length,
    channels: 3,
    background: "#000",
  },
})
  .composite(tiles)
  .webp({ quality: 72 })
  .toFile("docs/home-matched-openings-preview.webp");
await browser.close();
if (errors.length) {
  console.error(errors);
  process.exit(1);
}
