import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
await mkdir("docs/screenshots", { recursive: true });
const browser = await chromium.launch({ channel: "chrome" });
const origin = process.env.TEST_URL || "http://127.0.0.1:4173";
const prefix = process.env.CAPTURE_PREFIX || "v2";
const suffix = process.env.QA_SUFFIX || "";
const results = [];
for (const [name, width, height] of [
  ["desktop", 1440, 1000],
  ["mobile", 390, 844],
]) {
  const page = await browser.newPage({
    viewport: { width, height },
    reducedMotion: "no-preference",
  });
  const errors = [];
  const filmRequests = [];
  const stages = [];
  page.on("request", (request) => {
    if (request.url().endsWith("/images/cargo-cinema.mp4"))
      filmRequests.push(request.url());
  });
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (e) => {
    if (e.type() === "error") errors.push(e.text());
  });
  await page.goto(origin);
  await page.evaluate(() => document.fonts.ready);
  await page.getByRole("button", { name: "Scene 1: The cargo" }).click();
  await page
    .locator('#movement[data-render-mode="webgl"]')
    .waitFor({ timeout: 30000 });
  await page.getByRole("button", { name: "Pause scene motion" }).click();
  for (const [index, chapter] of [
    ["1", "cargo"],
    ["2", "geometry"],
    ["3", "particles"],
    ["4", "globe"],
  ]) {
    await page
      .getByRole("button", { name: new RegExp(`Scene ${index}:`) })
      .click();
    await page.waitForTimeout(1700);
    const phase = await page.locator("#movement").getAttribute("data-phase");
    if (phase !== String(Number(index) - 1))
      throw new Error(`Wrong scene: ${phase}`);
    stages.push({
      chapter,
      phase,
      progress: await page.locator("#movement").getAttribute("data-progress"),
    });
    await page.screenshot({
      path: `docs/screenshots/${prefix}-${name}-${chapter}.png`,
    });
    console.log(`Captured ${name} ${chapter}`);
  }
  await page
    .getByRole("button", {
      name: "DXB Dubai — published location",
      exact: true,
    })
    .click();
  await page.screenshot({
    path: `docs/screenshots/${prefix}-${name}-location.png`,
  });
  results.push({
    viewport: { width, height },
    browser: browser.version(),
    renderMode: await page
      .locator("#movement")
      .getAttribute("data-render-mode"),
    filmRequests,
    stages,
    errors,
  });
  if (errors.length) throw new Error(errors.join("\n"));
  if (width < 821 && filmRequests.length)
    throw new Error("Mobile downloaded the desktop film");
  await page.close();
}
await browser.close();
await writeFile(
  `docs/cinema-checks${suffix}.json`,
  JSON.stringify(
    { origin, measuredAt: new Date().toISOString(), results },
    null,
    2,
  ),
);
