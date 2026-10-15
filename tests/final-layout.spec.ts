import { test, expect } from "@playwright/test";
for (const [width, height] of [
  [320, 844],
  [390, 667],
  [768, 1024],
  [1440, 1000],
])
  test(`review fixes stay legible at ${width}x${height}`, async ({ page }) => {
    test.setTimeout(60000);
    await page.setViewportSize({ width, height });
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto("/about");
    const number = page.locator(".foundation-year strong");
    await number.scrollIntoViewIfNeeded();
    const size = await number.evaluate((el) => ({
      height: el.getBoundingClientRect().height,
      font: parseFloat(getComputedStyle(el).fontSize),
    }));
    expect(size.height).toBeLessThan(size.font * 1.3);
    expect(await number.textContent()).toBe("01—05");
    await page.goto("/services");
    const sequence = page.locator(".journey");
    await expect(sequence).toHaveClass(/sequence-enhanced/);
    await sequence.evaluate((el) =>
      scrollTo({
        top:
          el.getBoundingClientRect().top +
          scrollY -
          104 +
          (el.offsetHeight - Math.min(innerHeight - 104, 850)) * 0.45,
        behavior: "instant",
      }),
    );
    await expect(sequence.locator(".sequence-scroll-cue")).toContainText(
      "3 / 5",
    );
    await page.waitForTimeout(700);
    const bounds = await sequence.evaluate((el) => {
      const cue = el
          .querySelector(".sequence-scroll-cue")!
          .getBoundingClientRect(),
        head = el.querySelector(".section-heading")!.getBoundingClientRect(),
        nav = document.querySelector(".site-header")!.getBoundingClientRect();
      return {
        cueTop: cue.top,
        cueBottom: cue.bottom,
        headingTop: head.top,
        navBottom: nav.bottom,
      };
    });
    expect(bounds.cueTop).toBeGreaterThanOrEqual(bounds.navBottom + 2);
    expect(bounds.headingTop).toBeGreaterThanOrEqual(bounds.cueBottom + 6);
    await sequence.getByRole("tab", { name: /Plan/ }).click();
    await expect(sequence.locator(".sequence-scroll-cue")).toContainText(
      "2 / 5",
    );
    if (width === 390)
      await page.screenshot({
        path: "docs/screenshots/final-fix-scroll-cue-mobile.png",
      });
    const region = page.getByRole("region", {
      name: "Transport mode comparison",
    });
    await region.evaluate((el) =>
      scrollTo({
        top: el.getBoundingClientRect().top + scrollY - 180,
        behavior: "instant",
      }),
    );
    if (await region.evaluate((el) => el.scrollWidth > el.clientWidth + 1)) {
      await expect(page.locator(".comparison-scroll-hint")).toBeVisible();
      await region.evaluate(
        (el) => (el.scrollLeft = el.scrollWidth - el.clientWidth),
      );
      expect(await region.evaluate((el) => el.scrollLeft)).toBeGreaterThan(0);
      const positions = await region.evaluate((el) => ({
        end: el.querySelector("thead th:last-child")!.getBoundingClientRect()
          .right,
        right: el.getBoundingClientRect().right,
      }));
      expect(positions.end).toBeLessThanOrEqual(positions.right + 1);
    } else {
      await expect(page.locator(".comparison-scroll-hint")).toBeHidden();
    }
    if (width === 390)
      await page.screenshot({
        path: "docs/screenshots/final-fix-comparison-mobile.png",
      });
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(width + 1);
  });
