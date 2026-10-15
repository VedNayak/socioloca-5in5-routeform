import { test, expect } from "@playwright/test";
test.use({ reducedMotion: "no-preference" });
for (const width of [1812, 1440])
  test(`homepage cards retain live geometry while pointer crosses them at ${width}px`, async ({
    page,
  }) => {
    test.setTimeout(60000);
    await page.setViewportSize({ width, height: 686 });
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto("/");
    const cards = page.locator(".service-triptych .media-assembly");
    await cards
      .first()
      .evaluate((el) =>
        scrollTo({
          top: scrollY + el.getBoundingClientRect().top - 100,
          behavior: "instant",
        }),
      );
    await expect(
      page.locator(".service-triptych .assembly-host canvas"),
    ).toHaveCount(3, { timeout: 30000 });
    await expect
      .poll(async () =>
        cards.evaluateAll((els) =>
          els.every((el) => el.classList.contains("relief-ready")),
        ),
      )
      .toBe(true);
    await cards.evaluateAll((els) => {
      document.documentElement.dataset.canvasRemovals = "0";
      els.forEach((el, i) => {
        el.querySelector("canvas")!.dataset.stabilityId = String(i);
        new MutationObserver((records) => {
          for (const record of records)
            for (const node of record.removedNodes)
              if (
                node instanceof Element &&
                (node.matches("canvas") || node.querySelector("canvas"))
              )
                document.documentElement.dataset.canvasRemovals = String(
                  Number(document.documentElement.dataset.canvasRemovals) + 1,
                );
        }).observe(el, { childList: true, subtree: true });
      });
    });
    for (let round = 0; round < 2; round++)
      for (let i = 0; i < 3; i++) {
        await cards.nth(i).locator(".assembly-host").hover();
        await page.waitForTimeout(250);
        await expect(cards.nth(i).locator("canvas")).toHaveAttribute(
          "data-stability-id",
          String(i),
        );
        await expect(cards.nth(i)).toHaveClass(/relief-ready/);
      }
    await page.mouse.wheel(0, 100);
    await page.waitForTimeout(250);
    await page.mouse.wheel(0, -100);
    await page.waitForTimeout(250);
    expect(
      await page.locator("html").getAttribute("data-canvas-removals"),
    ).toBe("0");
    await expect(
      page.locator(".service-triptych .assembly-host canvas"),
    ).toHaveCount(3);
    for (const host of await cards.locator(".assembly-host").all())
      expect(Number(await host.getAttribute("data-work-time"))).toBeGreaterThan(
        1,
      );
    await page.screenshot({
      path: `docs/screenshots/body-stable-${width}.png`,
    });
    await page.locator(".footer").scrollIntoViewIfNeeded();
    await expect(page.locator(".assembly-host canvas")).toHaveCount(0);
    expect(errors).toEqual([]);
  });
