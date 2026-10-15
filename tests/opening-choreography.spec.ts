import { test, expect } from "@playwright/test";
import sharp from "sharp";

for (const route of ["services", "industries", "about", "quote"]) {
  test(`${route} separates and resolves into a reversible clean geometric form`, async ({
    page,
  }) => {
    test.setTimeout(90000);
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.emulateMedia({ reducedMotion: "no-preference" });
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => {
      if (m.type() === "error") errors.push(m.text());
    });
    await page.goto("/" + route);
    await page.evaluate(() => document.fonts.ready);
    await page.getByRole("button", { name: "Pause opening motion" }).click();
    const scene = page.locator("#page-opening"),
      host = page.locator(".opening-geometry");
    const capture = async (p: number) => {
      await scene.evaluate(
        (el, p) =>
          scrollTo({
            top:
              el.getBoundingClientRect().top +
              scrollY +
              (el.clientHeight - innerHeight) * p,
            behavior: "instant",
          }),
        p,
      );
      await expect(scene).toHaveAttribute("data-ready", "true", {
        timeout: 25000,
      });
      await expect
        .poll(async () => Number(await host.getAttribute("data-progress")))
        .toBeCloseTo(p, 2);
      await page.waitForTimeout(2000);
      const canvas = await page
        .locator(".opening-geometry canvas")
        .screenshot();
      return sharp(canvas).resize(480, 333).removeAlpha().raw().toBuffer();
    };
    const diff = (a: Buffer, b: Buffer) => {
      let n = 0;
      for (let i = 0; i < a.length; i++) n += Math.abs(a[i] - b[i]);
      return n / a.length;
    };
    const structural = await capture(0.51),
      exploded = await capture(0.69),
      burst = await capture(0.8),
      connected = await capture(0.96);
    await expect(host).toHaveAttribute(
      "data-final-form",
      (
        {
          services: "geographic-services",
          industries: "geographic-industries",
          about: "geographic-about",
          quote: "dotted-calculator",
        } as Record<string, string>
      )[route],
    );
    await expect(host).toHaveAttribute("data-particle-opacity", "0.000");
    expect(
      diff(structural, exploded),
      "components must visibly separate",
    ).toBeGreaterThan(1.0);
    expect(
      diff(exploded, burst),
      "the field must visibly spread beyond the assembly",
    ).toBeGreaterThan(0.5);
    expect(
      diff(burst, connected),
      "the transition must resolve into crisp geometry with no particle cloud",
    ).toBeGreaterThan(0.5);
    const repeat = await capture(0.51);
    expect(
      diff(structural, repeat),
      "scrolling back must restore the registered assembly pose",
    ).toBeLessThan(0.6);
    const frozen = await capture(0.69),
      before = await host.getAttribute("data-work-time");
    await page.waitForTimeout(800);
    expect(await host.getAttribute("data-work-time")).toBe(before);
    expect(
      diff(
        frozen,
        await sharp(await page.locator(".opening-geometry canvas").screenshot())
          .resize(480, 333)
          .removeAlpha()
          .raw()
          .toBuffer(),
      ),
    ).toBeLessThan(0.6);
    await page.getByRole("button", { name: "Play opening motion" }).click();
    await expect
      .poll(async () => Number(await host.getAttribute("data-work-time")))
      .toBeGreaterThan(Number(before) + 0.15);
    expect(errors).toEqual([]);
  });
}
