import { test, expect } from "@playwright/test";
for (const [width, height] of [
  [390, 900],
  [320, 740],
  [430, 932],
  [390, 667],
]) {
  test(`mobile endpoints match Home at ${width}x${height}`, async ({
    page,
  }) => {
    test.setTimeout(120000);
    await page.setViewportSize({ width, height });
    await page.emulateMedia({ reducedMotion: "no-preference" });
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    let baseline = { x: 0, y: 0, size: 0 };
    for (const route of ["", "services", "industries", "about", "quote"]) {
      await page.goto("/" + route);
      const home = !route,
        scene = page.locator(home ? "#movement" : "#page-opening"),
        host = page.locator(home ? ".cinema-webgl" : ".opening-geometry");
      if (home) {
        await expect(scene).toHaveAttribute("data-render-mode", "webgl", {
          timeout: 30000,
        });
      } else {
        await expect(scene).toHaveAttribute("data-ready", "true", {
          timeout: 30000,
        });
      }
      await page
        .getByRole("button", {
          name: home ? "Pause scene motion" : "Pause opening motion",
          exact: true,
        })
        .click();
      // Assert the fully settled endpoint (> .94), independent of the header's
      // small contraction versus ScrollTrigger's initial measured start.
      // The sticky header contracts by 6px on first scroll. Measure the
      // shortened hero runway only after that layout change has settled.
      await page.evaluate(() => scrollTo({ top: 120, behavior: "instant" }));
      await expect
        .poll(
          async () =>
            (await page.locator(".header-inner").boundingBox())!.height,
        )
        .toBe(64);
      await scene.evaluate(
        (el, offset) =>
          scrollTo({
            top:
              scrollY +
              el.getBoundingClientRect().top -
              offset +
              (el.clientHeight - innerHeight + offset) * 0.96,
            behavior: "instant",
          }),
        home ? 96 : 100,
      );
      await expect
        .poll(async () =>
          Number(await (home ? scene : host).getAttribute("data-progress")),
        )
        .toBeGreaterThan(0.94);
      await expect(host).toHaveAttribute("data-endpoint-bounds", /.+/);
      const raw = JSON.parse(
        (await host.getAttribute("data-endpoint-bounds"))!,
      );
      const area = (await host.boundingBox())!;
      const bounds = { x: raw.x + area.x, y: raw.y + area.y, size: raw.size };
      if (home) {
        baseline = bounds;
        const cta = (await scene
          .locator(".cinema-copy-3 .inline-link")
          .boundingBox())!;
        expect(cta.y + cta.height, "Home final copy clearance").toBeLessThan(
          bounds.y - bounds.size / 2,
        );
      } else {
        expect(
          Math.abs(bounds.size - baseline.size),
          route + " projected size",
        ).toBeLessThan(3);
        expect(
          Math.abs(bounds.x - baseline.x),
          route + " horizontal centre",
        ).toBeLessThan(4);
        expect(
          Math.abs(bounds.y - baseline.y),
          route + " vertical centre",
        ).toBeLessThan(height <= 700 ? 110 : route === "quote" ? 12 : 4);
        const copy = (await scene.locator(".opening-copy-2").boundingBox())!;
        const controls = (await scene
          .locator(".opening-controls")
          .boundingBox())!;
        expect(copy.y + copy.height, route + " copy clearance").toBeLessThan(
          bounds.y - bounds.size / 2 + 2,
        );
        expect(
          bounds.y + bounds.size / 2,
          route + " control clearance",
        ).toBeLessThan(controls.y - 4);
      }
      expect(bounds.x - bounds.size / 2).toBeGreaterThan(0);
      expect(bounds.x + bounds.size / 2).toBeLessThan(width);
      await expect(host).toHaveAttribute("data-particle-opacity", "0.000");
      await page.screenshot({
        path: `docs/screenshots/mobile-endpoint-${width}x${height}-${route || "home"}.png`,
      });
      console.log(
        JSON.stringify({ width, height, route: route || "home", ...bounds }),
      );
    }
    expect(errors).toEqual([]);
  });
}
