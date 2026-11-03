import { test, expect } from "@playwright/test";
test.use({ hasTouch: true, isMobile: true, deviceScaleFactor: 1 });
for (const width of [320, 390, 430])
  test(`normal touch swipes reveal every hero at ${width}px`, async ({
    page,
  }) => {
    test.setTimeout(180000);
    await page.setViewportSize({ width, height: 844 });
    await page.emulateMedia({ reducedMotion: "no-preference" });
    const cdp = await page.context().newCDPSession(page),
      errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    async function swipe() {
      const x = Math.round(width * 0.65),
        start = 620,
        end = 360;
      await cdp.send("Input.dispatchTouchEvent", {
        type: "touchStart",
        touchPoints: [{ x, y: start }],
      });
      for (let i = 1; i <= 12; i++) {
        await cdp.send("Input.dispatchTouchEvent", {
          type: "touchMove",
          touchPoints: [{ x, y: start + ((end - start) * i) / 12 }],
        });
        await page.waitForTimeout(26);
      }
      await cdp.send("Input.dispatchTouchEvent", {
        type: "touchEnd",
        touchPoints: [],
      });
      // A normal pause between swipes lets the guided chunk finish, rather than
      // issuing a synthetic scroll teleport or rapid wheel-event burst.
      await page.waitForTimeout(1000);
    }
    for (const route of ["", "services", "industries", "about", "quote"]) {
      await page.goto("/" + route);
      const home = !route,
        hero = page.locator(home ? "#movement" : "#page-opening");
      await expect(hero).toHaveAttribute(
        home ? "data-render-mode" : "data-ready",
        home ? "webgl" : "true",
        { timeout: 30000 },
      );
      await page.waitForTimeout(700);
      const progress = async () =>
        Number(await hero.getAttribute("data-progress"));
      expect(await progress(), "no arrival autoplay").toBeLessThan(0.005);
      const initialScroll = await page.evaluate(() => scrollY);
      await swipe();
      await expect(hero).not.toContainText("SCROLL TO TRANSFORM");
      const first = await progress(),
        firstScroll = await page.evaluate(() => scrollY);
      expect(
        firstScroll - initialScroll,
        "native touch moves page",
      ).toBeGreaterThan(140);
      expect(first, "first swipe reveals a substantial chunk").toBeGreaterThan(
        0.28,
      );
      expect(first, "first normal swipe does not skip the finale").toBeLessThan(
        0.75,
      );
      const activeWords = hero.locator(
        home
          ? `.cinema-copy-${first < 0.22 ? 0 : first < 0.46 ? 1 : first < 0.73 ? 2 : 3} .cinema-word`
          : `.opening-copy-${first < 0.255 ? 0 : first < 0.68 ? 1 : 2} .opening-word`,
      );
      await expect(activeWords.first()).toBeVisible();
      await expect
        .poll(async () =>
          activeWords.evaluateAll((elements) =>
            elements.every((el) => {
              const m = new DOMMatrixReadOnly(getComputedStyle(el).transform);
              return (
                Math.abs(m.m42) < 0.5 &&
                Number(getComputedStyle(el).opacity) > 0.99
              );
            }),
          ),
        )
        .toBe(true);
      await page.screenshot({
        path: `docs/screenshots/touch-first-${width}-${route || "home"}.png`,
      });
      await swipe();
      expect(await progress(), "next swipe advances the story").toBeGreaterThan(
        first + 0.04,
      );
      // Inspect endpoint by its actual user control, then verify reverse seeking.
      const controls = hero.locator(
        home ? ".cinema-chapters button" : ".opening-controls>div>button",
      );
      await controls.last().click();
      await expect.poll(progress).toBeGreaterThan(0.87);
      const endpoint = page.locator(
        home ? ".cinema-webgl" : ".opening-geometry",
      );
      if (home)
        await expect
          .poll(async () =>
            Number(await endpoint.getAttribute("data-globe-opacity")),
          )
          .toBeGreaterThan(0.99);
      else {
        await expect
          .poll(async () =>
            Number(await endpoint.getAttribute("data-progress")),
          )
          .toBeGreaterThan(0.87);
        await expect(endpoint).toHaveAttribute(
          "data-final-form",
          route === "quote" ? "dotted-calculator" : `geographic-${route}`,
        );
      }
      await page.screenshot({
        path: `docs/screenshots/touch-final-${width}-${route || "home"}.png`,
      });
      await controls.first().click();
      await expect.poll(progress).toBeLessThan(0.07);
      let previous = await page.evaluate(() => scrollY);
      for (let i = 0; i < 9; i++) {
        await swipe();
        const current = await page.evaluate(() => scrollY);
        expect(current - previous, "no scroll trap").toBeGreaterThan(100);
        previous = current;
        if (
          (await hero.evaluate((el) => el.getBoundingClientRect().bottom)) < 600
        )
          break;
      }
      expect(
        await hero.evaluate((el) => el.getBoundingClientRect().bottom),
        "normal swipes reach page content",
      ).toBeLessThan(600);
      console.log(
        `${width}px ${route || "home"}: idle still, first swipe ${first.toFixed(3)}, headings settled, final/reverse/body release passed`,
      );
    }
    expect(errors).toEqual([]);
  });
