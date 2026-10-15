import { test, expect, type Page, type Locator } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import sharp from "sharp";
test.use({ reducedMotion: "no-preference" });
for (const [route, title, action] of [
  ["about", "Built around cargo.", "Meet Routeform"],
  ["industries", "Built around", "Explore solutions"],
]) {
  test(`${route} canonical trailing-slash route hydrates with its own hero`, async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(`/${route}/`);
    await expect(page.locator("#page-opening")).toHaveClass(/opening-enhanced/);
    await expect(page.locator("#page-opening h1")).toContainText(title);
    await expect(
      page
        .locator(".opening-first")
        .getByRole("link", { name: action, exact: true }),
    ).toBeVisible();
    expect(errors).toEqual([]);
  });
}
async function objectPixels(page: Page, host: Locator) {
  const box = await host.boundingBox();
  if (!box) throw new Error("The object must be visible before capture");
  const viewport = await page.evaluate(() => innerWidth);
  const shot = await page.screenshot();
  const metadata = await sharp(shot).metadata();
  const scale = metadata.width! / viewport;
  return sharp(shot)
    .extract({
      left: Math.max(0, Math.round(box.x * scale)),
      top: Math.max(0, Math.round(box.y * scale)),
      width: Math.round(box.width * scale),
      height: Math.round(box.height * scale),
    })
    .resize(512, 320)
    .removeAlpha()
    .raw()
    .toBuffer();
}

for (const route of ["services", "industries", "about", "quote"]) {
  test(`${route} has a distinct subject, opening and readable scene transitions`, async ({
    page,
  }) => {
    test.setTimeout(90000);
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(`/${route}`);
    const story = page.locator("#page-opening");
    await expect(story.locator("h1")).toBeVisible();
    await expect(story).toHaveAttribute("data-opening", route);
    expect(
      await story.evaluate((el) => el.clientHeight / innerHeight),
    ).toBeGreaterThan(route === "quote" ? 1.7 : 2.7);
    for (const phase of [1, 2]) {
      await story.locator(".opening-controls>div>button").nth(phase).click();
      await expect(story).toHaveAttribute("data-ready", "true", {
        timeout: 35000,
      });
      await expect(story.locator(".opening-geometry canvas")).toHaveCount(1);
      await expect(story).toHaveAttribute("data-phase", String(phase), {
        timeout: 15000,
      });
      await expect(story.locator(`.opening-copy-${phase}`)).toHaveAttribute(
        "aria-hidden",
        "false",
      );
      await expect(story.locator(`.opening-copy-${phase} h2`)).toBeVisible();
    }
    const target = route === "quote" ? "#quote-start" : "#intro";
    await story.locator(`a.opening-skip[href="${target}"]`).click();
    await expect(page.locator(target)).toBeInViewport();
    expect(errors).toEqual([]);
  });
}

test("service objects are 3D by default with a bounded body canvas budget", async ({
  page,
}) => {
  test.setTimeout(90000);
  await page.goto("/services#intro");
  await expect(page.locator("#page-opening")).toHaveClass(/opening-enhanced/);
  await expect(page.locator(".page-context .type-word").first()).toBeAttached();
  await expect(page.locator("#intro")).toBeInViewport();
  await page.evaluate(() => document.fonts.ready);
  for (const [id, model] of [
    ["ocean", "ship"],
    ["air", "plane"],
    ["land", "truck"],
    ["warehousing", "forklift"],
    ["customs", "crate"],
  ]) {
    const scene = page.locator(`#${id} .media-assembly`);
    const bounds = await scene.evaluate((el) => ({
      top: el.getBoundingClientRect().top + scrollY,
      height: el.clientHeight,
      viewport: innerHeight,
    }));
    // Enter the image at the lower edge, then progress naturally through its camera swing.
    await page.evaluate(
      (y) => scrollTo({ top: y, behavior: "instant" }),
      bounds.top - bounds.viewport * 0.82,
    );
    await page.mouse.wheel(0, bounds.viewport * 0.6);
    await expect(scene).toHaveClass(/relief-ready/, { timeout: 20000 });
    await expect(scene).toHaveAttribute("data-model", model);
    await expect
      .poll(
        async () =>
          Number(
            await scene
              .locator(".assembly-host")
              .getAttribute("data-assembly-progress"),
          ),
        { timeout: 15000 },
      )
      .toBeGreaterThan(0.65);
    expect(
      await page.locator(".assembly-host canvas").count(),
    ).toBeLessThanOrEqual(3);
    await expect(scene.locator("canvas")).toHaveCount(1);
    expect(
      await scene
        .locator(".assembly-poster")
        .evaluateAll((els) =>
          els.every((el) => getComputedStyle(el).visibility === "hidden"),
        ),
    ).toBe(true);
    await expect(scene).toHaveAttribute("data-relief-view", "model");
    await expect(
      scene.locator("img:not(.assembly-poster),picture"),
    ).toHaveCount(0);
    await expect(
      scene.getByRole("button", { name: /^Assemble|Show photograph/ }),
    ).toHaveCount(0);
    await expect
      .poll(async () =>
        Number(
          await scene
            .locator(".assembly-host")
            .getAttribute("data-assembly-progress"),
        ),
      )
      .toBeGreaterThan(0.99);
  }
  const violations = (
    await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
      .analyze()
  ).violations;
  expect(violations.map((v) => v.id)).toEqual([]);
});

test("object camera responds to keyboard and graphics loss retains static geometry", async ({
  page,
}) => {
  test.setTimeout(60000);
  await page.goto("/services#warehousing");
  const scene = page.locator("#warehousing .media-assembly");
  await scene.scrollIntoViewIfNeeded();
  await expect(scene).toHaveClass(/relief-ready/, { timeout: 20000 });
  const host = scene.locator(".assembly-host");
  await expect
    .poll(async () => Number(await host.getAttribute("data-assembly-progress")))
    .toBeGreaterThan(0.99);
  await host.focus();
  await expect(host).toBeFocused();
  await scene.getByRole("button", { name: "Pause working animation" }).click();
  await host.focus();
  const before = await objectPixels(page, host);
  await expect
    .poll(
      async () => {
        await expect(host).toBeFocused();
        await page.keyboard.press("ArrowRight");
        await page.keyboard.press("ArrowRight");
        const after = await objectPixels(page, host);
        let changed = 0;
        for (let i = 0; i < Math.min(before.length, after.length); i += 3)
          if (Math.abs(before[i] - after[i]) > 12) changed++;
        return changed;
      },
      { timeout: 10000 },
    )
    .toBeGreaterThan(100);
  await scene
    .locator("canvas")
    .evaluate((canvas) =>
      (canvas as HTMLCanvasElement)
        .getContext("webgl2")
        ?.getExtension("WEBGL_lose_context")
        ?.loseContext(),
    );
  await expect(scene.locator("canvas")).toHaveCount(0);
  await expect(scene.locator(".assembly-static")).toBeVisible();
  await expect(scene.locator(".assembly-unavailable")).toContainText(
    "static geometry",
  );
  await expect(
    page
      .locator("#warehousing")
      .getByRole("link", { name: "Plan warehousing" }),
  ).toBeVisible();
});

test("native scrolling advances every workflow stage without changing quote choices", async ({
  page,
}) => {
  for (const [route, selector] of [
    ["services", ".journey"],
    ["industries", ".supply-chain"],
  ]) {
    await page.goto(`/${route}#intro`);
    const sequence = page.locator(selector);
    await expect(sequence).toHaveClass(/sequence-enhanced/);
    const bounds = await sequence.evaluate((el) => ({
      top: el.getBoundingClientRect().top + scrollY,
      height: el.clientHeight,
      viewport: innerHeight,
    }));
    const distance = bounds.height - Math.min(bounds.viewport - 104, 850);
    for (let phase = 0; phase < 5; phase++) {
      await page.evaluate(
        (y) => scrollTo(0, y),
        bounds.top - 104 + distance * ((phase + 0.35) / 5),
      );
      await expect(sequence).toHaveAttribute(
        "data-sequence-active",
        String(phase),
      );
    }
  }
  await page.goto("/quote?mode=air#quote-start");
  await expect(
    page.getByRole("radio", { name: "Air freight", exact: true }),
  ).toBeChecked();
  await page.mouse.wheel(0, 350);
  await expect(
    page.getByRole("radio", { name: "Air freight", exact: true }),
  ).toBeChecked();
});

test("reduced motion keeps static geometry and manual stages", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/services#warehousing");
  await page.locator("#warehousing").scrollIntoViewIfNeeded();
  await expect(page.locator(".assembly-host canvas")).toHaveCount(0);
  await expect(page.locator("#warehousing .assembly-static")).toBeVisible();
  await expect(
    page.locator("#warehousing").locator("img:not(.assembly-poster),picture"),
  ).toHaveCount(0);
  await expect(page.locator(".journey")).not.toHaveClass(/sequence-enhanced/);
  await page.getByRole("tab", { name: /Deliver/ }).click();
  await expect(page.locator(".journey-panel")).toBeVisible();
});

for (const [width, height] of [
  [390, 844],
  [320, 844],
  [390, 667],
]) {
  test(`mobile scroll stages remain visible at ${width}x${height}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height });
    for (const [route, selector, panel] of [
      ["services", ".journey", ".journey-panel"],
      ["industries", ".supply-chain", ".chain-detail"],
    ]) {
      await page.goto(`/${route}#intro`);
      await expect(page.locator("#page-opening")).toHaveClass(
        /opening-enhanced/,
      );
      expect(
        await page
          .locator("#page-opening")
          .evaluate((el) => el.clientHeight / innerHeight),
      ).toBeGreaterThan(2.6);
      await expect(
        page.locator(".page-context .type-word").first(),
      ).toBeAttached();
      await expect(page.locator("#intro")).toBeInViewport();
      await expect(page.locator(".cinema-webgl canvas")).toHaveCount(0);
      await page.evaluate(() => document.fonts.ready);
      const sequence = page.locator(selector);
      await expect(sequence).toHaveClass(/sequence-enhanced/);
      const bounds = await sequence.evaluate((el) => ({
        top: el.getBoundingClientRect().top + scrollY,
        height: el.clientHeight,
        viewport: innerHeight,
      }));
      const distance = bounds.height - Math.min(bounds.viewport - 104, 850);
      for (let step = 0; step < 5; step++) {
        await page.evaluate(
          (y) => scrollTo({ top: y, behavior: "instant" }),
          bounds.top - 104 + distance * ((step + 0.5) / 5),
        );
        await expect(sequence).toHaveAttribute(
          "data-sequence-active",
          String(step),
        );
        await expect(sequence.locator(panel)).toBeInViewport({ ratio: 1 });
      }
      const dimensions = await page.evaluate(() => ({
        width: innerWidth,
        scroll: document.documentElement.scrollWidth,
      }));
      expect(dimensions.scroll).toBeLessThanOrEqual(dimensions.width + 1);
    }
  });
}
