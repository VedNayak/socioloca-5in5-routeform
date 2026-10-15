import { chromium, expect } from "@playwright/test";
import { writeFile } from "node:fs/promises";
const origin = process.env.TEST_URL || "http://127.0.0.1:4197";
const b = await chromium.launch({ channel: "chrome" }),
  page = await b.newPage({ reducedMotion: "no-preference" }),
  samples = [];
for (const width of [1440, 390]) {
  await page.setViewportSize({ width, height: width > 820 ? 1000 : 844 });
  for (const route of ["services", "about"]) {
    await page.goto(origin + "/" + route);
    await page.locator(".opening-controls>div>button").nth(2).click();
    await expect(page.locator(".opening-geometry")).toHaveAttribute(
      "data-geometry",
      "volumetric",
    );
    await page.waitForTimeout(1000);
    await page.locator(".opening-geometry").evaluate((el) => {
      window.openingSamples = [];
      window.openingObserver = new MutationObserver((records) => {
        if (records.some((r) => r.attributeName === "data-work-time"))
          window.openingSamples.push(performance.now());
      });
      window.openingObserver.observe(el, {
        attributes: true,
        attributeFilter: ["data-work-time"],
      });
    });
    await page.waitForTimeout(3000);
    samples.push({
      width,
      route,
      measurement: await page.evaluate(() => {
        window.openingObserver.disconnect();
        const times = window.openingSamples;
        const duration = times.length > 1 ? times.at(-1) - times[0] : 0;
        return {
          frames: times.length,
          fps: duration ? ((times.length - 1) * 1000) / duration : 0,
          observedMilliseconds: duration,
        };
      }),
    });
  }
}
await b.close();
const report = {
  scope:
    "Short installed-Chrome host samples of rendered scene updates; not physical-device or field performance acceptance",
  samples,
};
await writeFile("docs/motion-sample-v7.json", JSON.stringify(report, null, 2));
console.log(report);
