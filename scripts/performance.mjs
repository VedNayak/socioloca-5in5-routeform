import lighthouse from "lighthouse";
import desktopConfig from "lighthouse/core/config/desktop-config.js";
import { launch } from "chrome-launcher";
import { writeFile } from "node:fs/promises";
const suffix = process.env.QA_SUFFIX || "";
const chrome = await launch({
  chromePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  chromeFlags: ["--headless", "--no-first-run"],
});
try {
  const results = [];
  for (const formFactor of ["desktop", "mobile"]) {
    const report = await lighthouse(
      process.env.TEST_URL || "http://127.0.0.1:4173/",
      {
        port: chrome.port,
        output: "json",
        logLevel: "error",
        onlyCategories: ["performance", "accessibility", "best-practices"],
      },
      formFactor === "desktop" ? desktopConfig : undefined,
    );
    if (!report) throw new Error("No Lighthouse report returned");
    const lhr = report.lhr;
    await writeFile(
      `docs/lighthouse-${formFactor}${suffix}.json`,
      JSON.stringify(lhr, null, 2),
    );
    const result = {
      formFactor,
      url: lhr.finalDisplayedUrl || lhr.finalUrl,
      measuredAt: lhr.fetchTime,
      scores: Object.fromEntries(
        Object.entries(lhr.categories).map(([key, c]) => [key, c.score]),
      ),
      metrics: Object.fromEntries(
        [
          "first-contentful-paint",
          "largest-contentful-paint",
          "total-blocking-time",
          "cumulative-layout-shift",
          "speed-index",
        ].map((key) => [
          key,
          {
            value: lhr.audits[key].numericValue,
            display: lhr.audits[key].displayValue,
          },
        ]),
      ),
      opportunities: Object.entries(lhr.audits)
        .filter(
          ([, a]) =>
            a.details?.type === "opportunity" &&
            a.score !== null &&
            a.score < 1,
        )
        .map(([id, a]) => ({
          id,
          title: a.title,
          description: a.displayValue,
        })),
    };
    results.push(result);
    console.log(JSON.stringify(result));
  }
  await writeFile(
    `docs/performance-summary${suffix}.json`,
    JSON.stringify(results, null, 2),
  );
} finally {
  await chrome.kill();
}
