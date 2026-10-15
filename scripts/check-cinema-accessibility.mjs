import { chromium } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { writeFile } from "node:fs/promises";
const origin = process.env.TEST_URL || "http://127.0.0.1:4173";
const suffix = process.env.QA_SUFFIX || "";
const browser = await chromium.launch({ channel: "chrome" });
const context = await browser.newContext({ reducedMotion: "no-preference" });
const results = [];
try {
  for (const [width, height] of [
    [1440, 1000],
    [390, 844],
  ]) {
    const page = await context.newPage();
    await page.setViewportSize({ width, height });
    await page.goto(origin);
    await page.getByRole("button", { name: "Scene 1: The cargo" }).click();
    await page
      .locator('#movement[data-render-mode="webgl"]')
      .waitFor({ timeout: 30000 });
    await page.getByRole("button", { name: "Pause scene motion" }).click();
    for (let scene = 1; scene <= 4; scene++) {
      await page
        .getByRole("button", { name: new RegExp(`Scene ${scene}:`) })
        .click();
      await page.waitForTimeout(1500);
      const audit = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
        .analyze();
      results.push({
        width,
        scene,
        violations: audit.violations.map((v) => ({
          id: v.id,
          nodes: v.nodes.map((n) => ({
            target: n.target,
            summary: n.failureSummary,
          })),
        })),
      });
    }
    await page.close();
  }
  const page = await context.newPage();
  for (const route of ["/services", "/industries", "/about", "/quote"]) {
    await page.goto(origin + route);
    await page.waitForTimeout(1800);
    const audit = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
      .analyze();
    results.push({
      route,
      violations: audit.violations.map((v) => ({
        id: v.id,
        nodes: v.nodes.map((n) => ({
          target: n.target,
          summary: n.failureSummary,
        })),
      })),
    });
  }
  await page.close();
} finally {
  await context.close();
  await browser.close();
}
await writeFile(
  `docs/cinema-accessibility${suffix}.json`,
  JSON.stringify(results, null, 2),
);
console.log(JSON.stringify(results, null, 2));
if (results.some((r) => r.violations.length)) process.exitCode = 1;
