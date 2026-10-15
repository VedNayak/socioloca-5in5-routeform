import { chromium } from "@playwright/test";
import { writeFile } from "node:fs/promises";
const suffix = process.env.QA_SUFFIX || "";
const origin = (process.env.TEST_URL || "http://127.0.0.1:4174").replace(
  /\/$/,
  "",
);
const browser = await chromium.launch({ channel: "chrome" });
const page = await browser.newPage({
  viewport: { width: 1440, height: 1000 },
  reducedMotion: "reduce",
});
const errors = [];
const expectedRecoveryMessages = [];
let checkingRecovery = false;
page.on("pageerror", (error) => errors.push(error.message));
page.on("console", (message) => {
  if (message.type() !== "error") return;
  const location = message.location().url;
  if (
    checkingRecovery &&
    /404/.test(message.text()) &&
    (!location || location === origin + "/route-not-found")
  )
    expectedRecoveryMessages.push(message.text());
  else errors.push(message.text());
});
const pages = [];
try {
  for (const route of ["/", "/services", "/industries", "/about", "/quote"]) {
    const response = await page.goto(origin + route);
    await page.locator("h1").waitFor();
    for (const img of await page.locator("img").all()) {
      await img.scrollIntoViewIfNeeded();
      await img.evaluate((el) => el.decode().catch(() => {}));
    }
    const broken = await page.evaluate(() =>
      Array.from(document.images)
        .filter((img) => !img.naturalWidth)
        .map((img) => img.src),
    );
    const entry = {
      route,
      status: response.status(),
      url: page.url(),
      title: await page.title(),
      brokenImages: broken,
      robots: response.headers()["x-robots-tag"] || null,
      csp: !!response.headers()["content-security-policy"],
    };
    pages.push(entry);
    console.log(JSON.stringify(entry));
  }
  checkingRecovery = true;
  const notFound = await page.goto(origin + "/route-not-found");
  const report = {
    origin,
    browser: browser.version(),
    pages,
    notFoundStatus: notFound.status(),
    consoleErrors: errors,
    expectedRecoveryMessages,
  };
  await writeFile(
    `docs/live-checks${suffix}.json`,
    JSON.stringify(report, null, 2),
  );
  if (
    errors.length ||
    report.notFoundStatus !== 404 ||
    pages.some(
      (page) =>
        page.status !== 200 ||
        page.brokenImages.length ||
        !page.csp ||
        !page.robots?.includes("noindex"),
    )
  )
    throw new Error(
      `Live smoke check failed; inspect docs/live-checks${suffix}.json`,
    );
  console.log(
    `All five routes passed; 404 status ${report.notFoundStatus}; console errors ${errors.length}.`,
  );
} finally {
  await browser.close();
}
