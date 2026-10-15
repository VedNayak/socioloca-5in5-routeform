import { chromium } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { writeFile } from "node:fs/promises";
const browser = await chromium.launch();
const context = await browser.newContext({
  reducedMotion: "reduce",
  viewport: { width: 1440, height: 1000 },
});
const page = await context.newPage();
const results = [];
const origin = (process.env.TEST_URL || "http://127.0.0.1:5173").replace(
  /\/$/,
  "",
);
for (const route of ["/", "/services", "/industries", "/about", "/quote"]) {
  await page.goto(origin + route);
  const result = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .analyze();
  const violations = result.violations.map((v) => ({
    id: v.id,
    nodes: v.nodes.map((n) => ({
      target: n.target,
      summary: n.failureSummary,
      html: n.html,
    })),
  }));
  results.push({ route, url: page.url(), violations });
  console.log(JSON.stringify({ route, violations }));
}
await writeFile("docs/accessibility.json", JSON.stringify(results, null, 2));
await browser.close();
