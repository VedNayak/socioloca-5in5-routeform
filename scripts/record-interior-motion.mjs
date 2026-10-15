import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
const out = "docs/screenshots/interior-v3";
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ channel: "chrome" });
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  reducedMotion: "no-preference",
  recordVideo: { dir: `${out}/recording`, size: { width: 1440, height: 1000 } },
});
const page = await context.newPage(),
  started = Date.now();
await page.goto(
  (process.env.TEST_URL || "http://127.0.0.1:4173") + "/services",
);
await page.getByRole("button", { name: "Scene 1: The cargo" }).click();
await page
  .locator('#movement[data-render-mode="webgl"]')
  .waitFor({ timeout: 35000 });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(1200);
const readyAt = (Date.now() - started) / 1000;
async function sweep(start, end, duration) {
  await page.evaluate(
    ({ start, end, duration }) =>
      new Promise((resolve) => {
        const began = performance.now();
        const tick = (now) => {
          const t = Math.min(1, (now - began) / duration);
          window.scrollTo({
            top: start + (end - start) * t,
            behavior: "instant",
          });
          if (t < 1) requestAnimationFrame(tick);
          else resolve();
        };
        requestAnimationFrame(tick);
      }),
    { start, end, duration },
  );
}
const distance = await page
  .locator("#movement")
  .evaluate((el) => el.offsetHeight - innerHeight);
await sweep(0, distance * 0.89, 11000);
for (const id of ["ocean", "air", "warehousing"]) {
  const scene = page.locator(`#${id} .media-assembly`);
  const top = await scene.evaluate(
    (el) => el.getBoundingClientRect().top + scrollY,
  );
  await page.evaluate(
    (y) => scrollTo({ top: y, behavior: "instant" }),
    top - 820,
  );
  await page.waitForTimeout(700);
  await sweep(top - 820, top - 190, 3800);
  await scene.getByRole("button", { name: /^Assemble/ }).click();
  await page.waitForTimeout(700);
  const box = await scene.locator(".assembly-host").boundingBox();
  await page.mouse.move(box.x + box.width * 0.7, box.y + box.height * 0.5);
  await page.waitForTimeout(600);
}
const video = page.video();
await context.close();
await video.saveAs(`${out}/routeform-interior-motion.webm`);
await browser.close();
await writeFile(
  `${out}/recording.json`,
  JSON.stringify(
    {
      readyAt,
      source: "Actual browser recording, not generated website footage",
      origin: process.env.TEST_URL || "http://127.0.0.1:4173",
    },
    null,
    2,
  ),
);
console.log(
  `Recorded ${out}/routeform-interior-motion.webm; trim start ${readyAt.toFixed(2)}s`,
);
