import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
await mkdir("docs/screenshots/recording", { recursive: true });
const browser = await chromium.launch({ channel: "chrome" });
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  reducedMotion: "no-preference",
  recordVideo: {
    dir: "docs/screenshots/recording",
    size: { width: 1440, height: 1000 },
  },
});
const page = await context.newPage();
await page.goto(process.env.TEST_URL || "http://127.0.0.1:4173");
await page.getByRole("button", { name: "Scene 1: The cargo" }).click();
await page
  .locator('#movement[data-render-mode="webgl"]')
  .waitFor({ timeout: 30000 });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(1500);
await page.evaluate(
  () =>
    new Promise((resolve) => {
      const scene = document.getElementById("movement");
      const start = scene.getBoundingClientRect().top + scrollY;
      const distance = scene.offsetHeight - innerHeight;
      const began = performance.now();
      const tick = (now) => {
        const t = Math.min(1, (now - began) / 16000);
        window.scrollTo({
          top: start + distance * t * 0.9,
          behavior: "instant",
        });
        if (t < 1) requestAnimationFrame(tick);
        else resolve();
      };
      requestAnimationFrame(tick);
    }),
);
await page
  .getByRole("button", { name: "DXB Dubai — published location", exact: true })
  .click();
await page.waitForTimeout(1800);
const recording = page.video();
await context.close();
await recording.saveAs("docs/screenshots/routeform-dimensional-preview.webm");
await browser.close();
await writeFile(
  "docs/screenshots/recording/README.txt",
  "Actual browser recording of the running website. A QA preview, not generated footage or a website video asset.",
);
console.log(
  "Recorded actual native-scroll scene to docs/screenshots/routeform-dimensional-preview.webm",
);
