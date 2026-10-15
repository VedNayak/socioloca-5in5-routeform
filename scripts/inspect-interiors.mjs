import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import AxeBuilder from "@axe-core/playwright";
const base = process.env.TEST_URL || "http://127.0.0.1:5188";
const out = "docs/screenshots/interior-v3";
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ channel: "chrome" });
const report = [];
for (const [label, width, height] of [
  ["desktop", 1440, 1000],
  ["mobile", 390, 844],
]) {
  const context = await browser.newContext({
    viewport: { width, height },
    reducedMotion: "no-preference",
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  for (const route of ["services", "industries", "about", "quote"]) {
    await page.goto(`${base}/${route}`);
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(1200);
    await page.screenshot({ path: `${out}/${label}-${route}-hero.png` });
    if (route !== "quote") {
      const media = page.locator(".media-assembly").first();
      await media.scrollIntoViewIfNeeded();
      await media.getByRole("button", { name: /^Assemble/ }).click();
      await page.waitForFunction(
        () =>
          document.querySelector(".media-assembly.relief-ready .assembly-host")
            ?.dataset.assemblyProgress > 0.99,
      );
      await page.waitForTimeout(150);
      await page.screenshot({ path: `${out}/${label}-${route}-model.png` });
      const audit = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
        .analyze();
      report.push({
        label,
        route,
        overflow: await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth + 1,
        ),
        violations: audit.violations.map((v) => ({
          id: v.id,
          targets: v.nodes.map((n) => n.target),
        })),
      });
    }
  }
  await page.goto(base + "/services");
  for (const service of ["ocean", "air", "land", "warehousing", "customs"]) {
    const media = page.locator(`#${service} .media-assembly`);
    await media.scrollIntoViewIfNeeded();
    await media.getByRole("button", { name: /^Assemble/ }).click();
    await page.waitForFunction(
      (id) =>
        document.querySelector(`#${id} .assembly-host`)?.dataset
          .assemblyProgress > 0.99,
      service,
    );
    await page.screenshot({ path: `${out}/${label}-${service}-assembly.png` });
  }
  for (const [route, selector, name] of [
    ["services", ".journey", "journey"],
    ["industries", ".supply-chain", "supply-chain"],
  ]) {
    await page.goto(`${base}/${route}#intro`);
    await page.locator("#movement.cinema-enhanced").waitFor();
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(1200);
    await page.locator(selector).evaluate((el) => {
      const distance = el.clientHeight - Math.min(innerHeight - 104, 850);
      scrollTo({
        top: el.getBoundingClientRect().top + scrollY - 104 + distance * 0.5,
        behavior: "instant",
      });
    });
    await page.waitForTimeout(600);
    await page.screenshot({ path: `${out}/${label}-${name}.png` });
  }
  report.push({ label, errors });
  await context.close();
}
await writeFile(
  `${out}/report.json`,
  JSON.stringify(
    {
      origin: base,
      measuredAt: new Date().toISOString(),
      browser: browser.version(),
      report,
    },
    null,
    2,
  ),
);
await browser.close();
console.log(JSON.stringify(report));
