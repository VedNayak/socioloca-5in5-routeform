import { chromium } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { writeFile } from "node:fs/promises";
const origin = process.env.TEST_URL || "http://127.0.0.1:4197";
const browser = await chromium.launch({ channel: "chrome" }),
  audits = [],
  errors = [];
for (const width of [1440, 390]) {
  const context = await browser.newContext({
    viewport: { width, height: width > 820 ? 1000 : 844 },
    reducedMotion: "no-preference",
  });
  const page = await context.newPage();
  page.on("pageerror", (e) => errors.push(e.message));
  for (const route of ["services", "industries", "about", "quote"]) {
    await page.goto(`${origin}/${route}`);
    await page.evaluate(() => document.fonts.ready);
    await page.getByRole("button", { name: "Pause opening motion" }).click();
    for (const progress of [0, 0.52, 0.86]) {
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
      await page.waitForTimeout(1200);
      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
        .analyze();
      audits.push({
        width,
        route,
        progress,
        violations: results.violations.map((v) => ({
          id: v.id,
          targets: v.nodes.map((n) => n.target),
        })),
      });
    }
  }
  await page.goto(`${origin}/quote?mode=air#quote-start`);
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  const result = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .analyze();
  audits.push({
    width,
    route: "quote-errors",
    violations: result.violations.map((v) => ({
      id: v.id,
      targets: v.nodes.map((n) => n.target),
    })),
  });
  await context.close();
}
await writeFile(
  "docs/accessibility-v7.json",
  JSON.stringify(
    { origin, browser: browser.version(), errors, audits },
    null,
    2,
  ),
);
await browser.close();
const failures = audits.filter((a) => a.violations.length);
console.log(JSON.stringify({ audits: audits.length, errors, failures }));
if (failures.length || errors.length) process.exitCode = 1;
