import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import AxeBuilder from "@axe-core/playwright";
import sharp from "sharp";
const base = process.env.TEST_URL || "http://127.0.0.1:5196",
  out = "docs/screenshots/v4";
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ channel: "chrome" }),
  report = [],
  captures = [];
for (const [device, width, height] of [
  ["desktop", 1440, 1000],
  ["mobile", 390, 844],
]) {
  const context = await browser.newContext({
      viewport: { width, height },
      reducedMotion: "no-preference",
    }),
    page = await context.newPage(),
    errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  for (const name of ["services", "industries", "about", "quote"]) {
    await page.goto(`${base}/${name}/`);
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(1100);
    const opening = page.locator("#page-opening");
    for (const [stage, fraction] of [
      [0, 0],
      [1, 0.52],
      [2, 0.86],
    ]) {
      await opening.evaluate(
        (el, f) =>
          scrollTo({
            top:
              el.getBoundingClientRect().top +
              scrollY +
              (el.clientHeight - innerHeight) * f,
            behavior: "instant",
          }),
        fraction,
      );
      if (stage)
        await page.waitForFunction(
          () =>
            document.querySelector("#page-opening")?.dataset.ready === "true",
        );
      await page.waitForTimeout(1100);
      const path = `${out}/${device}-${name}-${stage}.png`;
      await page.screenshot({ path });
      captures.push(path);
      const audit = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
        .analyze();
      report.push({
        device,
        name,
        stage,
        violations: audit.violations.map((v) => ({
          id: v.id,
          targets: v.nodes.map((n) => n.target),
        })),
        overflow: await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth + 1,
        ),
      });
    }
    await page.getByRole("switch", { name: "Dark theme" }).click();
    await page.reload();
    await page.waitForTimeout(900);
    const path = `${out}/${device}-${name}-dark.png`;
    await page.screenshot({ path });
    captures.push(path);
    const audit = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
      .analyze();
    report.push({
      device,
      name,
      theme: "dark",
      violations: audit.violations.map((v) => ({
        id: v.id,
        targets: v.nodes.map((n) => n.target),
      })),
    });
    if (name === "quote")
      for (const [stage, fraction] of [
        [1, 0.52],
        [2, 0.86],
      ]) {
        await opening.evaluate(
          (el, f) =>
            scrollTo({
              top:
                el.getBoundingClientRect().top +
                scrollY +
                (el.clientHeight - innerHeight) * f,
              behavior: "instant",
            }),
          fraction,
        );
        await page.waitForFunction(
          () =>
            document.querySelector("#page-opening")?.dataset.ready === "true",
        );
        await page.waitForTimeout(1100);
        const path = `${out}/${device}-${name}-dark-${stage}.png`;
        await page.screenshot({ path });
        captures.push(path);
        const audit = await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
          .analyze();
        report.push({
          device,
          name,
          stage,
          theme: "dark",
          violations: audit.violations.map((v) => ({
            id: v.id,
            targets: v.nodes.map((n) => n.target),
          })),
        });
      }
    await page.getByRole("switch", { name: "Dark theme" }).click();
  }
  for (const [id, kind] of [
    ["ocean", "ship"],
    ["air", "plane"],
    ["land", "truck"],
    ["warehousing", "forklift"],
    ["customs", "crate"],
  ]) {
    await page.goto(`${base}/services#${id}`);
    const scene = page.locator(`#${id} .media-assembly`);
    await scene.scrollIntoViewIfNeeded();
    await scene.getByRole("button", { name: /^Assemble/ }).click();
    await page.waitForFunction(
      (id) =>
        +document.querySelector(`#${id} .assembly-host`)?.dataset
          .assemblyProgress > 0.99,
      id,
    );
    await page.waitForTimeout(1200);
    const path = `${out}/${device}-work-${kind}.png`;
    await page.screenshot({ path });
    captures.push(path);
  }
  await page.getByRole("switch", { name: "Dark theme" }).click();
  await page.goto(`${base}/quote#quote-start`);
  await page.locator(".quote-layout").scrollIntoViewIfNeeded();
  await page.waitForTimeout(900);
  const path = `${out}/${device}-quote-form-dark.png`;
  await page.screenshot({ path });
  captures.push(path);
  const audit = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .analyze();
  report.push({
    device,
    name: "quote-form-dark",
    violations: audit.violations.map((v) => ({
      id: v.id,
      targets: v.nodes.map((n) => n.target),
    })),
  });
  report.push({ device, errors });
  await context.close();
}
await browser.close();
await writeFile(
  `${out}/report.json`,
  JSON.stringify({ base, report, captures }, null, 2),
);
for (const device of ["desktop", "mobile"]) {
  const paths = captures.filter((p) => p.includes("/" + device + "-"));
  const w = device === "desktop" ? 480 : 260,
    h = device === "desktop" ? 334 : 563,
    columns = device === "desktop" ? 3 : 4;
  const thumbs = await Promise.all(
    paths.map((p) =>
      sharp(p)
        .resize(w, h, { fit: "contain", background: "#262d2e" })
        .png()
        .toBuffer(),
    ),
  );
  await sharp({
    create: {
      width: columns * w,
      height: Math.ceil(thumbs.length / columns) * h,
      channels: 3,
      background: "#262d2e",
    },
  })
    .composite(
      thumbs.map((input, i) => ({
        input,
        left: (i % columns) * w,
        top: Math.floor(i / columns) * h,
      })),
    )
    .webp({ quality: 88 })
    .toFile(`${out}/${device}-montage.webp`);
}
console.log(
  JSON.stringify(
    report.filter(
      (r) => r.violations?.length || r.overflow || r.errors?.length,
    ),
    null,
    2,
  ),
);
if (report.some((r) => r.violations?.length || r.overflow || r.errors?.length))
  process.exitCode = 1;
console.log(
  captures.length +
    " screenshots; " +
    report.filter((r) => r.violations).length +
    " accessibility audits.",
);
