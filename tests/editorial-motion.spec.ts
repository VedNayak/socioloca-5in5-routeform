import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("an orange sweep travels through heading glyphs and settles to the base colour", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/services#intro");
  const heading = page.locator(".page-intro-main h2");
  await expect(heading).toHaveClass(/heading-lit/);
  const samples = await heading.evaluate(
    (el) =>
      new Promise<number[]>((resolve) => {
        const values: number[] = [];
        const start = performance.now();
        const sample = () => {
          values.push(
            parseFloat(getComputedStyle(el).getPropertyValue("--text-sweep")),
          );
          if (performance.now() - start < 1800) requestAnimationFrame(sample);
          else resolve(values);
        };
        sample();
      }),
  );
  expect(samples.some((n) => n > 0 && n < 100)).toBeTruthy();
  expect(samples.at(-1)).toBe(125);
  expect(
    await heading
      .locator(".type-word")
      .first()
      .evaluate((el) => getComputedStyle(el).backgroundImage),
  ).toContain("linear-gradient");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(heading.locator(".type-word")).toHaveCount(0);
});

test("each journey stage has original distinct geometry and finite GSAP motion", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/services");
  const journey = page.locator(".journey");
  await journey.scrollIntoViewIfNeeded();
  const paths: string[] = [];
  for (const [i, name] of [
    "Understand",
    "Plan",
    "Prepare",
    "Move",
    "Deliver",
  ].entries()) {
    await journey.getByRole("tab", { name: `0${i + 1} ${name}` }).click();
    const icon = journey.locator(`[data-journey-icon="${i}"]`);
    await expect(icon).toBeVisible();
    await expect(icon).toHaveAttribute("data-icon-motion", "complete", {
      timeout: 5000,
    });
    paths.push(await icon.locator(".icon-drawing").innerHTML());
    await expect(journey.getByRole("tabpanel")).toContainText(
      [
        "Start with the cargo.",
        "Choose the right movement.",
        "Get the details ready.",
        "Connect each handover.",
        "Finish at the destination.",
      ][i],
    );
  }
  expect(new Set(paths).size).toBe(5);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(journey.locator(".journey-stage-visual")).not.toHaveAttribute(
    "data-icon-motion",
  );
  expect(
    await journey.locator(".icon-drawing").getAttribute("style"),
  ).not.toContain("transform");
});

for (const width of [1440, 768, 390, 320]) {
  test(`journey icon and copy do not overlap at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/services");
    const journey = page.locator(".journey");
    await journey.scrollIntoViewIfNeeded();
    for (const name of ["01 Understand", "03 Prepare", "05 Deliver"]) {
      await journey.getByRole("tab", { name }).click();
      const icon = await journey.locator(".journey-stage-visual").boundingBox();
      const text = await journey.locator(".journey-panel h3").boundingBox();
      expect(icon).not.toBeNull();
      expect(text).not.toBeNull();
      const intersection =
        Math.max(
          0,
          Math.min(icon!.x + icon!.width, text!.x + text!.width) -
            Math.max(icon!.x, text!.x),
        ) *
        Math.max(
          0,
          Math.min(icon!.y + icon!.height, text!.y + text!.height) -
            Math.max(icon!.y, text!.y),
        );
      expect(intersection).toBe(0);
    }
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(width + 1);
    const a11y = await new AxeBuilder({ page })
      .include(".journey")
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(a11y.violations).toEqual([]);
  });
}

test("editorial entrances settle on all routes and reduced motion restores unsplit content", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.emulateMedia({ reducedMotion: "no-preference" });
  for (const route of ["/", "/services", "/industries", "/about", "/quote"]) {
    await page.goto(route);
    const heading = page.locator(
      route === "/"
        ? ".intro-text h2"
        : route === "/quote"
          ? ".quote-intro h2"
          : ".page-intro-main h2",
    );
    await heading.scrollIntoViewIfNeeded();
    await expect(heading).toHaveClass(/heading-lit/);
    const block = heading.locator("xpath=..");
    await expect(block).toHaveAttribute("data-reveal-state", "complete", {
      timeout: 6000,
    });
    const words = await heading.locator(".type-word").evaluateAll((els) =>
      els.map((el) => ({
        opacity: getComputedStyle(el).opacity,
        y: new DOMMatrix(getComputedStyle(el).transform).m42,
      })),
    );
    expect(words.length).toBeGreaterThan(2);
    expect(
      words.every((w) => Number(w.opacity) === 1 && Math.abs(w.y) < 0.1),
    ).toBeTruthy();
    await page.emulateMedia({ reducedMotion: "reduce" });
    await expect(heading.locator(".type-word")).toHaveCount(0);
    await expect(heading).toBeVisible();
    await page.emulateMedia({ reducedMotion: "no-preference" });
  }
  expect(errors).toEqual([]);
});
