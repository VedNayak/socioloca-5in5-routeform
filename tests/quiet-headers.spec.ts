import { test, expect } from "@playwright/test";
for (const width of [1440, 390])
  test(`all five openings have clean particle-free transitions at ${width}px`, async ({
    page,
  }) => {
    test.setTimeout(180000);
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: "no-preference" });
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    for (const route of ["", "services", "industries", "about", "quote"]) {
      await page.goto("/" + route);
      const home = !route,
        scene = page.locator(home ? "#movement" : "#page-opening"),
        host = page.locator(home ? ".cinema-webgl" : ".opening-geometry");
      if (home) {
        await page
          .getByRole("button", { name: "Scene 1: The cargo", exact: true })
          .click();
        await expect(scene).toHaveAttribute("data-render-mode", "webgl", {
          timeout: 30000,
        });
      } else {
        await scene.locator(".opening-controls>div>button").first().click();
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
      for (const p of [0.32, 0.5, 0.67, 0.96]) {
        await scene.evaluate(
          (el, { p, offset }) =>
            scrollTo({
              top:
                scrollY +
                el.getBoundingClientRect().top -
                offset +
                (el.clientHeight - innerHeight + offset) * p,
              behavior: "instant",
            }),
          { p, offset: width < 821 ? (home ? 96 : 100) : 0 },
        );
        await expect(host.locator("canvas")).toHaveCount(1, { timeout: 30000 });
        await expect
          .poll(async () =>
            Number(await (home ? scene : host).getAttribute("data-progress")),
          )
          .toBeCloseTo(p, 2);
        await expect(host).toHaveAttribute("data-particle-opacity", "0.000");
        if (!home) await expect(host).toHaveAttribute("data-anchor-count", "0");
        if (p === 0.5 || p === 0.96)
          await page.screenshot({
            path: `docs/screenshots/quiet-header-${width}-${route || "home"}-${p}.png`,
          });
      }
      if (home)
        expect(
          Number(await host.getAttribute("data-globe-opacity")),
        ).toBeGreaterThan(0.99);
      else
        await expect(host).toHaveAttribute(
          "data-final-form",
          route === "quote" ? "dotted-calculator" : `geographic-${route}`,
        );
    }
    expect(errors).toEqual([]);
  });
