import { chromium, expect } from "@playwright/test";
import sharp from "sharp";
import { mkdir } from "node:fs/promises";
const base = process.env.TEST_URL || "http://127.0.0.1:4194";
const out = "docs/screenshots/interior-v3";
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ channel: "chrome" });
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  reducedMotion: "no-preference",
});
const page = await context.newPage();
const tiles = [];
try {
  await page.goto(`${base}/services#intro`);
  await page.locator("#movement.cinema-enhanced").waitFor();
  await page.evaluate(() => document.fonts.ready);
  for (const id of ["ocean", "air", "warehousing"]) {
    const media = page.locator(`#${id} .media-assembly`);
    await media.scrollIntoViewIfNeeded();
    await media.getByRole("button", { name: /^Assemble/ }).click();
    await page.waitForFunction(
      (id) =>
        Number(
          document.querySelector(`#${id} .assembly-host`)?.dataset
            .assemblyProgress,
        ) > 0.99,
      id,
    );
    const path = `${out}/proof-${id}.png`;
    await media.locator(".relief-housing").screenshot({ path });
    tiles.push({
      input: await sharp(path).resize(500, 334).toBuffer(),
      left: 16 + tiles.length * 516,
      top: 16,
    });
  }
  await sharp({
    create: { width: 1564, height: 366, channels: 3, background: "#f3f1e9" },
  })
    .composite(tiles)
    .webp({ quality: 88 })
    .toFile("docs/interior-preview.webp");
  for (const height of [844, 667]) {
    await page.setViewportSize({ width: 390, height });
    await page.goto(`${base}/industries#intro`);
    await page.locator("#movement.cinema-enhanced").waitFor();
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(1200);
    const sequence = page.locator(".supply-chain");
    await sequence.evaluate((el) => {
      const distance = el.clientHeight - Math.min(innerHeight - 104, 850);
      scrollTo({
        top: el.getBoundingClientRect().top + scrollY - 104 + distance * 0.5,
        behavior: "instant",
      });
    });
    await expect(sequence.locator(".chain-detail")).toBeInViewport({
      ratio: 1,
    });
    await page.screenshot({ path: `${out}/mobile-supply-chain-${height}.png` });
  }
  console.log(
    "Captured ship, aircraft, forklift and final mobile workflow; composed actual browser proof.",
  );
} finally {
  await context.close();
  await browser.close();
}
