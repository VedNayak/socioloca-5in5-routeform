import { test, expect, type Page, type Locator } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import sharp from "sharp";
const routes = ["/", "/services", "/industries", "/about", "/quote"];
test("narrow home actions clear the scene controls and opening adapts on resize", async ({
  page,
}) => {
  test.setTimeout(60000);
  await page.setViewportSize({ width: 320, height: 844 });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  await expect(page.locator("#movement")).toHaveClass(/cinema-enhanced/);
  await page.evaluate(() => document.fonts.ready);
  const actions = await page
      .locator(".cinema-copy-0 .cinema-actions")
      .boundingBox(),
    controls = await page.locator(".cinema-controls").boundingBox();
  expect(actions!.y + actions!.height).toBeLessThan(controls!.y);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/services");
  await page.locator(".opening-controls>div>button").nth(1).click();
  await expect(page.locator("#page-opening")).toHaveAttribute(
    "data-ready",
    "true",
    { timeout: 25000 },
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator(".opening-film")).toHaveCount(0);
  await expect
    .poll(async () =>
      page
        .locator(".opening-picture img")
        .evaluate((img) => (img as HTMLImageElement).currentSrc),
    )
    .toMatch(/services-mobile/);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator(".opening-geometry canvas")).toHaveCount(0);
  await expect(page.locator(".opening-first h1")).toBeVisible();
});
async function visiblePixels(page: Page, host: Locator, rightHalf = false) {
  const box = await host.boundingBox();
  if (!box) throw new Error("Visible rendering area required");
  const viewport = await page.evaluate(() => ({
    width: innerWidth,
    height: innerHeight,
  }));
  const shot = await page.screenshot(),
    metadata = await sharp(shot).metadata(),
    scale = metadata.width! / viewport.width;
  const left = Math.max(0, box.x + (rightHalf ? box.width * 0.5 : 0)),
    top = Math.max(0, box.y),
    right = Math.min(viewport.width, box.x + box.width),
    bottom = Math.min(viewport.height, box.y + box.height);
  return sharp(shot)
    .extract({
      left: Math.round(left * scale),
      top: Math.round(top * scale),
      width: Math.floor((right - left) * scale),
      height: Math.floor((bottom - top) * scale),
    })
    .resize(400, 280)
    .removeAlpha()
    .raw()
    .toBuffer();
}
for (const width of [1440, 390, 320]) {
  test(`dark-only complete routes at ${width}px ignore old light preference`, async ({
    page,
  }) => {
    test.setTimeout(90000);
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/");
    await page.evaluate(() => localStorage.setItem("routeform-theme", "light"));
    for (const route of routes) {
      await page.goto(route);
      await expect(
        page.getByRole("switch", { name: "Dark theme" }),
      ).toHaveCount(0);
      await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
      await expect(page.locator("h1")).toBeVisible();
      const size = await page.evaluate(() => ({
        width: innerWidth,
        scroll: document.documentElement.scrollWidth,
        bg: getComputedStyle(document.body).backgroundColor,
      }));
      expect(size.scroll).toBeLessThanOrEqual(size.width + 1);
      expect(size.bg).toBe("rgb(16, 29, 33)");
    }
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  });
}
for (const route of routes)
  test(`dark theme accessibility ${route}`, async ({ page }) => {
    await page.goto(route);
    const audit = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(
      audit.violations.map((v) => ({
        id: v.id,
        nodes: v.nodes.map((n) => n.target),
      })),
    ).toEqual([]);
  });
test("five supply-chain operations have distinct original icons", async ({
  page,
}) => {
  await page.goto("/industries");
  const stages = page.locator(".chain-steps button");
  await expect(stages).toHaveCount(5);
  const paths = await stages
    .locator("svg[data-logistics-icon] path")
    .evaluateAll((els) => els.map((el) => el.getAttribute("d")));
  expect(new Set(paths).size).toBe(5);
  for (const label of [
    "Origin",
    "Consolidation",
    "Transport",
    "Clearance",
    "Destination",
  ]) {
    await page.getByRole("button", { name: label, exact: true }).click();
    await expect(page.locator(".chain-detail h3")).toHaveText(label);
  }
});
const subjects = [
  ["ocean", "ship"],
  ["air", "plane"],
  ["land", "truck"],
  ["warehousing", "forklift"],
  ["customs", "crate"],
];
test("a late film cannot replace a poster after its structural handoff", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/services");
  const scene = page.locator("#page-opening"),
    host = scene.locator(".opening-geometry");
  await expect(scene).toHaveClass(/opening-enhanced/);
  const clip = scene.locator("video");
  await expect(clip).toBeAttached();
  // WebKit's native media loader can bypass request interception. Exercise
  // actual unavailable-to-decoded media states directly, before any graphics.
  await clip.evaluate((v) => {
    const video = v as HTMLVideoElement;
    video.pause();
    video.removeAttribute("src");
    video.load();
  });
  await scene.evaluate((el) =>
    scrollTo({
      top: (el.clientHeight - innerHeight) * 0.52,
      behavior: "instant",
    }),
  );
  await expect(scene).toHaveAttribute("data-ready", "true", {
    timeout: 25000,
  });
  await expect(host).toHaveAttribute("data-frame-source", "poster");
  await clip.evaluate((v) => {
    const video = v as HTMLVideoElement;
    video.src = "/images/opening-v6-services.mp4";
    video.preload = "auto";
    video.load();
  });
  await expect
    .poll(
      () =>
        page
          .locator("video")
          .evaluate((v) => (v as HTMLVideoElement).readyState),
      { timeout: 15000 },
    )
    .toBeGreaterThanOrEqual(2);
  await expect(host).toHaveAttribute("data-frame-source", "poster");
});
for (const route of routes.slice(1))
  test(`${route} film/poster handoff preserves actual rendered framing on desktop and mobile`, async ({
    page,
  }) => {
    test.setTimeout(60000);
    await page.emulateMedia({ reducedMotion: "no-preference" });
    for (const [width, height] of [
      [1440, 1000],
      [390, 844],
    ]) {
      await page.setViewportSize({ width, height });
      await page.goto(route);
      await page.evaluate(() => document.fonts.ready);
      if (width > 820)
        await expect
          .poll(() =>
            page
              .locator("video")
              .evaluate((v) => (v as HTMLVideoElement).readyState),
          )
          .toBeGreaterThanOrEqual(2);
      await page.getByRole("button", { name: "Pause opening motion" }).click();
      const scene = page.locator("#page-opening"),
        host = scene.locator(".opening-geometry");
      await scene.evaluate((el) =>
        scrollTo({
          top:
            el.getBoundingClientRect().top +
            scrollY +
            (el.clientHeight - innerHeight) * 0.05,
          behavior: "instant",
        }),
      );
      await expect(scene).toHaveAttribute("data-ready", "true", {
        timeout: 25000,
      });
      // Before the peel at 0.12 the plate alone is on screen, as on Home.
      await expect
        .poll(async () => Number(await host.getAttribute("data-progress")))
        .toBeLessThan(0.1);
      await expect(host).toHaveAttribute(
        "data-frame-source",
        width > 820 ? "film" : "poster",
      );
      await page.waitForTimeout(1500);
      const gpu = await visiblePixels(page, host);
      await scene.evaluate((el) => {
        (el as HTMLElement).style.setProperty("--opening-media", "1");
        (el.querySelector("canvas") as HTMLElement).style.visibility = "hidden";
      });
      const native = await visiblePixels(page, host);
      let total = 0;
      for (let i = 0; i < gpu.length; i++)
        total += Math.abs(gpu[i] - native[i]);
      // Separate browser media and GPU pipelines must agree in framing and colour.
      // An unrelated model/camera, black texture or stretched/cropped frame fails this.
      expect(total / gpu.length).toBeLessThan(5);
      await scene.evaluate((el) => {
        (el as HTMLElement).style.setProperty("--opening-media", "0");
        (el.querySelector("canvas") as HTMLElement).style.visibility =
          "visible";
      });
      await scene.evaluate((el) =>
        scrollTo({
          top:
            el.getBoundingClientRect().top +
            scrollY +
            (el.clientHeight - innerHeight) * 0.52,
          behavior: "instant",
        }),
      );
      await expect(scene).toHaveAttribute("data-phase", "1");
      await expect
        .poll(async () => Number(await host.getAttribute("data-anchor-count")))
        .toBeGreaterThan(100);
      if (width > 820) {
        const clip = page.locator("video");
        await expect
          .poll(() => clip.evaluate((v) => (v as HTMLVideoElement).paused))
          .toBe(true);
        const t = await clip.evaluate(
          (v) => (v as HTMLVideoElement).currentTime,
        );
        await page.waitForTimeout(200);
        expect(
          await clip.evaluate((v) => (v as HTMLVideoElement).currentTime),
        ).toBe(t);
      }
    }
  });
for (const [id, kind] of subjects)
  test(`${kind} performs visible work, pauses and releases its canvas`, async ({
    page,
  }) => {
    test.setTimeout(60000);
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto(`/services#${id}`);
    const scene = page.locator(`#${id} .media-assembly`);
    await scene.scrollIntoViewIfNeeded();
    await expect(scene).toHaveAttribute("data-relief-view", "model");
    await expect(scene.locator("img,picture")).toHaveCount(0);
    const host = scene.locator(".assembly-host");
    await expect
      .poll(
        async () => Number(await host.getAttribute("data-assembly-progress")),
        { timeout: 25000 },
      )
      .toBeGreaterThan(0.99);
    const pixels = () => visiblePixels(page, host);
    await page.waitForTimeout(500);
    const a = await pixels();
    await page.waitForTimeout(1500);
    const b = await pixels();
    let changed = 0;
    for (let i = 0; i < a.length; i += 3)
      if (Math.abs(a[i] - b[i]) > 8) changed++;
    expect(changed).toBeGreaterThan(100);
    await scene
      .getByRole("button", { name: "Pause working animation" })
      .click();
    await page.waitForTimeout(900);
    const stopped = await pixels();
    await page.waitForTimeout(650);
    expect(await pixels()).toEqual(stopped);
    await scene.getByRole("button", { name: "Play working animation" }).click();
    await expect(host).toHaveAttribute("data-working", "true");
    await page.locator(".footer").scrollIntoViewIfNeeded();
    await expect(page.locator(".assembly-host canvas")).toHaveCount(0);
  });
test("opening particles react to pointer and graphics loss restores the still", async ({
  page,
}) => {
  test.setTimeout(60000);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/services");
  const scene = page.locator("#page-opening");
  await scene.locator(".opening-controls>div>button").nth(2).click();
  await expect(scene).toHaveAttribute("data-ready", "true", { timeout: 25000 });
  await expect(scene).toHaveAttribute("data-phase", "2");
  await page.getByRole("button", { name: "Pause opening motion" }).click();
  await page.mouse.move(1, 1);
  await page.waitForTimeout(1900);
  const canvas = scene.locator("canvas"),
    before = await visiblePixels(
      page,
      scene.locator(".opening-geometry"),
      true,
    );
  const viewport = await page.evaluate(() => ({
    width: innerWidth,
    height: innerHeight,
  }));
  let changed = 0;
  for (const [x, y] of [
    [0.65, 0.4],
    [0.75, 0.5],
    [0.82, 0.58],
  ]) {
    await page.mouse.move(viewport.width * x, viewport.height * y);
    await page.waitForTimeout(350);
    const after = await visiblePixels(
      page,
      scene.locator(".opening-geometry"),
      true,
    );
    let difference = 0;
    for (let i = 0; i < before.length; i += 3)
      if (Math.abs(before[i] - after[i]) > 8) difference++;
    changed = Math.max(changed, difference);
  }
  expect(changed).toBeGreaterThan(100);
  await canvas.evaluate((el) =>
    (el as HTMLCanvasElement)
      .getContext("webgl2")
      ?.getExtension("WEBGL_lose_context")
      ?.loseContext(),
  );
  await expect(canvas).toHaveCount(0);
  await expect(scene.locator("img")).toBeVisible();
  await expect(scene.locator(".opening-skip")).toBeVisible();
});
test("reduced-motion and mobile openings do not request films", async ({
  page,
}) => {
  const requests: string[] = [];
  page.on("request", (r) => {
    if (/opening-.*\.mp4/.test(r.url())) requests.push(r.url());
  });
  for (const motion of ["reduce", "no-preference"] as const) {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.emulateMedia({ reducedMotion: motion });
    for (const route of routes.slice(1)) {
      await page.goto(route);
      await expect(page.locator(".opening-film")).toHaveCount(0);
      if (motion === "reduce") {
        await expect(page.locator(".opening-geometry canvas")).toHaveCount(0);
        await expect(page.locator("#page-opening")).not.toHaveClass(
          /opening-enhanced/,
        );
      }
    }
  }
  expect(requests).toEqual([]);
});
