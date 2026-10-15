import { chromium, expect } from "@playwright/test";
import { writeFile, mkdir } from "node:fs/promises";
const origin = (process.env.TEST_URL || "http://127.0.0.1:4196").replace(
    /\/$/,
    "",
  ),
  errors = [],
  routes = [];
const b = await chromium.launch({ channel: "chrome" }),
  p = await b.newPage({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: "no-preference",
  });
p.on("pageerror", (e) => errors.push(e.message));
p.on("console", (m) => {
  if (m.type() === "error") errors.push(m.text());
});
for (const route of ["services", "industries", "about", "quote"]) {
  const response = await p.goto(origin + "/" + route);
  await expect
    .poll(() => p.locator("video").evaluate((v) => v.readyState))
    .toBeGreaterThanOrEqual(2);
  await p.locator(".opening-controls>div>button").nth(2).click();
  await expect(p.locator("#page-opening")).toHaveAttribute(
    "data-ready",
    "true",
    { timeout: 25000 },
  );
  await expect(p.locator(".opening-geometry")).toHaveAttribute(
    "data-geometry",
    "volumetric",
  );
  await p.getByRole("button", { name: "Pause opening motion" }).click();
  await p.waitForTimeout(1300);
  routes.push({
    route,
    status: response.status(),
    image: await p
      .locator(".opening-picture img")
      .evaluate((img) => ({
        source: img.currentSrc,
        decoded: img.naturalWidth > 0,
      })),
    scene: await p
      .locator(".opening-geometry")
      .evaluate((el) => ({ ...el.dataset })),
    overflow: await p.evaluate(
      () => document.documentElement.scrollWidth - innerWidth,
    ),
  });
}
await p.goto(origin + "/");
await p.locator(".cinema-controls button").nth(1).click();
await p.waitForTimeout(2200);
await mkdir("docs/screenshots/v6", { recursive: true });
await p.screenshot({ path: "docs/screenshots/v6/home-reference.png" });
await b.close();
const report = { origin, errors, routes };
await writeFile(
  "docs/structural-smoke-v6.json",
  JSON.stringify(report, null, 2),
);
console.log(JSON.stringify(report));
if (
  errors.length ||
  routes.some((r) => r.status !== 200 || !r.image.decoded || r.overflow > 1)
)
  process.exitCode = 1;
