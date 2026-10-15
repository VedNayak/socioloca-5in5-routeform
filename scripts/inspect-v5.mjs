import { chromium } from "@playwright/test";
import sharp from "sharp";
import { mkdir, writeFile } from "node:fs/promises";
const origin = process.env.TEST_URL || "http://127.0.0.1:4198";
const folder = "docs/screenshots/v5";
await mkdir(folder, { recursive: true });
const browser = await chromium.launch({ channel: "chrome" });
const errors = [],
  reports = [];
for (const [device, width, height] of [
  ["desktop", 1440, 1000],
  ["mobile", 390, 844],
]) {
  const page = await browser.newPage({
    viewport: { width, height },
    reducedMotion: "no-preference",
  });
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  for (const route of ["services", "industries", "about", "quote"]) {
    await page.goto(`${origin}/${route}`);
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(1200);
    await page.getByRole("button", { name: "Pause opening motion" }).click();
    for (const p of [0, 0.19, 0.28, 0.38, 0.52, 0.86]) {
      await page
        .locator("#page-opening")
        .evaluate(
          (el, p) =>
            scrollTo({
              top:
                el.getBoundingClientRect().top +
                scrollY +
                (el.clientHeight - innerHeight) * p,
              behavior: "instant",
            }),
          p,
        );
      await page.waitForTimeout(1250);
      await page.screenshot({ path: `${folder}/${device}-${route}-${p}.png` });
      reports.push({
        device,
        route,
        p,
        graphics: await page
          .locator(".opening-geometry")
          .evaluate((el) => ({ ...el.dataset })),
        video: await page
          .locator("video")
          .evaluateAll((els) =>
            els.map((el) => ({ paused: el.paused, time: el.currentTime })),
          ),
        overflow: await page.evaluate(
          () => document.documentElement.scrollWidth - innerWidth,
        ),
      });
    }
  }
  for (const [id, kind] of [
    ["ocean", "ship"],
    ["air", "plane"],
    ["land", "truck"],
    ["warehousing", "forklift"],
    ["customs", "crate"],
  ]) {
    await page.goto(`${origin}/services#${id}`);
    const model = page.locator(`#${id} .media-assembly`);
    await model.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1200);
    await page.screenshot({ path: `${folder}/${device}-${kind}.png` });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.waitForTimeout(300);
    await page.screenshot({ path: `${folder}/${device}-${kind}-static.png` });
    await page.emulateMedia({ reducedMotion: "no-preference" });
  }
  await page.close();
}
await browser.close();
for (const p of [0.28, 0.52, 0.86]) {
  await sharp({
    create: { width: 1440, height: 1000, channels: 3, background: "#101d21" },
  })
    .composite(
      await Promise.all(
        ["services", "industries", "about", "quote"].map(async (route, i) => ({
          input: await sharp(`${folder}/desktop-${route}-${p}.png`)
            .resize(720, 500)
            .toBuffer(),
          left: (i % 2) * 720,
          top: Math.floor(i / 2) * 500,
        })),
      ),
    )
    .webp({ quality: 86 })
    .toFile(`${folder}/montage-${p}.webp`);
}
await writeFile(
  "docs/visual-qa-v5.json",
  JSON.stringify({ origin, errors, reports }, null, 2),
);
console.log(
  JSON.stringify({
    errors,
    captures: 68,
    overflow: reports.filter((r) => r.overflow > 1),
  }),
);
if (errors.length || reports.some((r) => r.overflow > 1)) process.exitCode = 1;
