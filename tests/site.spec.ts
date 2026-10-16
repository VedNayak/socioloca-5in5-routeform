import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import sharp from "sharp";
test("mobile loads the portrait hero without an inactive video poster", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  const desktopPosterRequests: string[] = [];
  page.on("request", (request) => {
    if (
      /\/images\/cargo-cinema\.(webp|avif|mp4)$/.test(
        new URL(request.url()).pathname,
      )
    )
      desktopPosterRequests.push(request.url());
  });
  await page.goto("/");
  await expect(page.locator(".hero-image img")).toHaveJSProperty(
    "complete",
    true,
  );
  await expect(page.locator("video")).not.toHaveAttribute("poster");
  expect(
    await page
      .locator(".hero-image img")
      .evaluate((el) => (el as HTMLImageElement).currentSrc),
  ).toMatch(/\/images\/cargo-cinema-mobile\.(avif|webp)$/);
  expect(
    await page
      .locator(".hero-image img")
      .evaluate((el) => (el as HTMLImageElement).naturalWidth),
  ).toBeGreaterThan(0);
  expect(desktopPosterRequests).toEqual([]);
});
const routes = ["/", "/services", "/industries", "/about", "/quote"];
for (const width of [1440, 768, 390, 320]) {
  test(`five routes load without overflow at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    for (const route of routes) {
      await page.goto(route);
      await expect(page.locator("h1")).toHaveCount(1);
      await expect(page.locator("h1")).toBeVisible();
      await expect(page).toHaveTitle(/Routeform/);
      for (const img of await page.locator("img").all()) {
        await img.scrollIntoViewIfNeeded();
        await expect(img).toHaveJSProperty("complete", true);
      }
      const layout = await page.evaluate(() => ({
        width: window.innerWidth,
        scroll: document.documentElement.scrollWidth,
        broken: Array.from(document.images)
          .filter((i) => !i.naturalWidth)
          .map((i) => i.src),
      }));
      expect(
        layout.scroll,
        `${route} has horizontal overflow`,
      ).toBeLessThanOrEqual(layout.width + 1);
      expect(layout.broken, `${route} broken images`).toEqual([]);
      await page.reload();
      await expect(page.locator("h1")).toBeVisible();
    }
    expect(errors).toEqual([]);
  });
}
for (const route of routes) {
  test(`accessibility essentials ${route}`, async ({ page }) => {
    await page.goto(route);
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(
      results.violations.map((v) => ({
        id: v.id,
        nodes: v.nodes.map((n) => n.target),
      })),
    ).toEqual([]);
  });
}
test("mobile menu traps focus, closes on Escape and navigates", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "Open navigation" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await dialog.getByRole("link", { name: "Request a quote" }).focus();
  await page.keyboard.press("Tab");
  await expect(
    dialog.getByRole("link", { name: "Routeform", exact: false }).first(),
  ).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(
    page.getByRole("button", { name: "Open navigation" }),
  ).toBeFocused();
  await page.getByRole("button", { name: "Open navigation" }).click();
  await dialog.getByRole("link", { name: "Industries & solutions" }).click();
  await expect(page).toHaveURL(/\/industries/);
  await expect(dialog).toBeHidden();
});
test("mega navigation, filters and FAQ disclosures work", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await page.getByRole("button", { name: "Explore service menu" }).click();
  await page
    .locator("#service-menu")
    .getByRole("link", { name: "Air freight" })
    .click();
  await expect(page).toHaveURL(/services#air/);
  await expect(page.locator("#air")).toBeVisible();
  await page
    .getByRole("button", { name: "Storage & support", exact: true })
    .click();
  await expect(page.locator(".service-editorial")).toHaveCount(2);
  await page.getByRole("button", { name: "All services", exact: true }).click();
  await expect(page.locator(".service-editorial")).toHaveCount(5);
  await page
    .getByText("Will the quote form send my enquiry?", { exact: true })
    .click();
  await expect(
    page.getByText("No. This demonstration prepares a brief locally", {
      exact: false,
    }),
  ).toBeVisible();
});
test("network filters, location details, route selection and pause", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Air", exact: true }).click();
  await expect(page.locator(".lane-selector button")).toHaveCount(1);
  await expect(page.locator(".route-panel")).toContainText(
    "Time-sensitive electronics",
  );
  await page.getByRole("button", { name: "RTM Rotterdam" }).click();
  await expect(page.locator(".node-detail")).toContainText(
    "no real Routeform office",
  );
  await page.getByRole("button", { name: "Pause motion" }).click();
  await expect(page.locator(".shipment-dot")).toHaveCount(0);
  await page.getByRole("button", { name: "Resume motion" }).click();
  await page.getByRole("button", { name: "Land", exact: true }).click();
  await expect(page.locator(".route-panel")).toContainText("Dubai → Riyadh");
});
test("timeline keyboard navigation and supply-chain nodes", async ({
  page,
}) => {
  await page.goto("/");
  const first = page.getByRole("tab", { name: "01 Understand" });
  await first.focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("tab", { name: "02 Plan" })).toBeFocused();
  await expect(page.getByRole("tabpanel")).toContainText(
    "Choose the right movement.",
  );
  await page.keyboard.press("End");
  await expect(page.getByRole("tabpanel")).toContainText(
    "Finish at the destination.",
  );
  await page.goto("/industries");
  await page
    .locator(".chain-steps")
    .getByRole("button", { name: "Clearance", exact: true })
    .click();
  await expect(page.locator(".chain-detail")).toContainText(
    "Prepare arrival paperwork",
  );
});
async function fillCargo(page: Page) {
  await page.getByLabel("Cargo category").selectOption("General merchandise");
  await page.getByLabel("Weight per piece").fill("500");
  await page.getByLabel("Package length").fill("120");
  await page.getByLabel("Package width").fill("80");
  await page.getByLabel("Package height").fill("100");
}
test("quote validates, supports edits and prepares an honest downloadable brief", async ({
  page,
}) => {
  await page.goto("/quote?mode=air");
  const transmissions: string[] = [];
  page.on("request", (r) => {
    if (r.method() !== "GET") transmissions.push(r.url());
  });
  await expect(page.getByRole("radio", { name: "Air freight" })).toBeChecked();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(
    page.getByText("Enter the origin city or facility."),
  ).toBeVisible();
  await expect(page.getByLabel("Origin city")).toBeFocused();
  await page.getByLabel("Origin city").fill("Hong Kong");
  await page.getByLabel("Destination city").fill("Dubai");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByLabel("Weight per piece").fill("");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(
    page.getByText("Enter a number greater than zero.").first(),
  ).toBeVisible();
  await fillCargo(page);
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByLabel("Cargo-ready date").fill("2030-11-01");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByLabel("Full name").fill("Demo Visitor");
  await page.getByLabel("Company / organisation").fill("Example Company");
  await page.getByLabel("Email address").fill("invalid");
  await page.getByLabel("Phone number").fill("+971501234567");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(page.getByText("Enter a valid email address.")).toBeVisible();
  await page.getByLabel("Email address").fill("demo@example.com");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("button", { name: "Edit Route", exact: true }).click();
  await expect(page.getByLabel("Origin city")).toHaveValue("Hong Kong");
  for (let i = 0; i < 4; i++)
    await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("button", { name: "Prepare demo brief" }).click();
  await expect(page.getByRole("alert")).toContainText("acknowledge");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Prepare demo brief" }).click();
  await expect(
    page.getByText("Nothing was transmitted.", { exact: true }),
  ).toBeVisible();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download shipment brief" }).click();
  expect((await download).suggestedFilename()).toBe(
    "routeform-demo-shipment-brief.txt",
  );
  expect(transmissions).toEqual([]);
  expect(
    await page.evaluate(() => ({
      local: localStorage.length,
      session: sessionStorage.length,
    })),
  ).toEqual({ local: 0, session: 0 });
  await page.reload();
  await expect(page.getByLabel("Origin city")).toHaveValue("");
});
test("quote conditional fields follow transport and cargo choices", async ({
  page,
}) => {
  await page.goto("/quote?mode=warehousing");
  await page.getByLabel("Origin city").fill("Dubai");
  await page.getByLabel("Storage destination").fill("Dubai");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(page.getByLabel("Estimated storage period")).toBeVisible();
  await page.getByLabel("Cargo category").selectOption("Food & perishables");
  await expect(page.getByLabel("Special handling requirements")).toBeVisible();
  await page.goto("/quote?mode=ocean");
  await page.getByLabel("Origin city").fill("Rotterdam");
  await page.getByLabel("Destination city").fill("Dubai");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(page.getByLabel("Load preference")).toBeVisible();
});
test("reduced motion removes film and continuous indicators", async ({
  page,
}) => {
  await page.goto("/");
  expect(await page.locator("video").getAttribute("src")).toBeNull();
  await expect(page.locator(".cinema-webgl canvas")).toHaveCount(0);
  await expect(
    page.locator('#movement article[aria-hidden="false"]'),
  ).toHaveCount(4);
  expect(
    await page
      .locator(".shipment-dot")
      .first()
      .evaluate((e) => getComputedStyle(e).display),
  ).toBe("none");
  expect(
    await page
      .locator(".cinema-line")
      .first()
      .evaluate((e) => getComputedStyle(e).animationName),
  ).toBe("none");
});
test("unknown route has useful recovery actions", async ({ page }) => {
  await page.goto("/this-route-does-not-exist");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "better route",
  );
  await page.getByRole("link", { name: "Return home" }).click();
  await expect(page).toHaveURL(/\/$/);
});

async function motionStory(page: Page, project: string) {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  if (project === "webkit") {
    const supported = await page.evaluate(() => {
      const canvas = document.createElement("canvas"),
        gl = canvas.getContext("webgl2");
      gl?.getExtension("WEBGL_lose_context")?.loseContext();
      return !!gl;
    });
    if (!supported) {
      await expect(page.locator("#movement")).toHaveClass(/cinema-static/);
      await expect(
        page.locator('#movement article[aria-hidden="false"]'),
      ).toHaveCount(4);
      return false;
    }
  }
  await page.getByRole("button", { name: "Scene 1: The cargo" }).click();
  await expect(page.locator("#movement")).toHaveAttribute(
    "data-render-mode",
    "webgl",
    { timeout: 30000 },
  );
  return true;
}

test("opening film is usable before graphics setup and native scroll starts the scene", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  const graphicsRequests: string[] = [];
  page.on("request", (request) => {
    if (/\/assets\/renderer-/.test(request.url()))
      graphicsRequests.push(request.url());
  });
  await page.goto("/");
  await expect(page.locator(".cinema-film")).toHaveAttribute(
    "src",
    "/images/cargo-cinema.mp4",
  );
  await expect
    .poll(() =>
      page
        .locator(".cinema-film")
        .evaluate((v) => (v as HTMLVideoElement).readyState),
    )
    .toBeGreaterThanOrEqual(2);
  await page.waitForTimeout(1000);
  await expect(page.locator(".cinema-webgl canvas")).toHaveCount(0);
  expect(graphicsRequests).toEqual([]);
  await expect(
    page.getByRole("link", { name: "Explore services", exact: true }),
  ).toBeVisible();
  await page.mouse.move(1100, 500);
  await page.mouse.wheel(0, 180);
  await expect(page.locator("#movement")).toHaveAttribute(
    "data-render-mode",
    "webgl",
    { timeout: 30000 },
  );
  await expect(page.locator(".cinema-webgl canvas")).toHaveCount(1);
});

test("cinematic story transforms through four scenes and supports mobile and reduced motion", async ({
  page,
}, info) => {
  test.setTimeout(90000); // Two graphics setups, including a runtime media change.
  await page.setViewportSize({ width: 1440, height: 1000 });
  if (!(await motionStory(page, info.project.name))) return;
  const story = page.locator("#movement");
  await expect(story.locator("canvas")).toHaveCount(1);
  for (let index = 0; index < 4; index++) {
    await page
      .getByRole("button", { name: new RegExp(`Scene ${index + 1}:`) })
      .click();
    await expect(story).toHaveAttribute("data-phase", String(index));
  }
  await page
    .getByRole("button", {
      name: "DXB Dubai — illustrative node",
      exact: true,
    })
    .click();
  await expect(
    page.getByRole("complementary", { name: "Illustrative network node" }),
  ).toContainText("No real Routeform office or facility is implied.");
  await page.getByRole("button", { name: "Close location detail" }).click();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(story).toHaveClass(/cinema-static/);
  await expect(story.locator("canvas")).toHaveCount(0);
  await expect(story.locator('article[aria-hidden="false"]')).toHaveCount(4);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect(story).toHaveClass(/cinema-enhanced/);
  await page.getByRole("button", { name: "Scene 1: The cargo" }).click();
  await expect(story).toHaveAttribute("data-render-mode", "webgl", {
    timeout: 30000,
  });
  await page.getByRole("button", { name: "Scene 4: The connections" }).click();
  await expect(story).toHaveAttribute("data-phase", "3");
  await expect(
    page.getByRole("button", {
      name: "DXB Dubai — illustrative node",
      exact: true,
    }),
  ).toBeInViewport();
  await page
    .getByRole("link", { name: "Continue to services", exact: true })
    .click();
  await expect(page.locator("#intro")).toBeInViewport();
});

test("pointer interaction changes the rendered wireframe scene while autonomous motion is paused", async ({
  page,
}, info) => {
  if (!(await motionStory(page, info.project.name))) return;
  await page.getByRole("button", { name: "Pause scene motion" }).click();
  await page.getByRole("button", { name: "Scene 2: The detail" }).click();
  await expect(page.locator("#movement")).toHaveAttribute("data-phase", "1");
  await page.waitForTimeout(2400);
  const canvas = page.locator(".cinema-webgl canvas");
  const pixels = async () => {
    const box = await canvas.boundingBox();
    if (!box) throw new Error("Visible scene canvas required");
    const viewport = await page.evaluate(() => ({
      width: innerWidth,
      height: innerHeight,
    }));
    const shot = await page.screenshot(),
      meta = await sharp(shot).metadata(),
      scale = meta.width! / viewport.width;
    const top = Math.max(0, box.y),
      left = Math.max(0, box.x);
    return sharp(shot)
      .extract({
        left: Math.round(left * scale),
        top: Math.round(top * scale),
        width: Math.floor(
          (Math.min(viewport.width, box.x + box.width) - left) * scale,
        ),
        height: Math.floor(
          (Math.min(viewport.height, box.y + box.height) - top) * scale,
        ),
      })
      .resize(960, 540)
      .removeAlpha()
      .raw()
      .toBuffer();
  };
  const before = await pixels();
  // Read the current bounds on each attempt: Windows WebKit can resize its
  // high-DPR capture surface asynchronously during a canvas screenshot.
  await expect
    .poll(
      async () => {
        const box = await canvas.boundingBox();
        if (!box) throw new Error("No visible scene canvas");
        await page.mouse.move(
          box.x + box.width * 0.72,
          box.y + box.height * 0.44,
        );
        await page.waitForTimeout(250);
        const after = await pixels();
        expect(after.length).toBe(before.length);
        let changed = 0;
        for (let i = 0; i < before.length; i += 3)
          if (
            Math.abs(before[i] - after[i]) +
              Math.abs(before[i + 1] - after[i + 1]) +
              Math.abs(before[i + 2] - after[i + 2]) >
            24
          )
            changed++;
        return changed;
      },
      {
        message: "The graphics must genuinely respond to the pointer",
        timeout: 10000,
      },
    )
    .toBeGreaterThan(100);
});

test("graphics context loss restores the complete readable story and working service links", async ({
  page,
}, info) => {
  if (!(await motionStory(page, info.project.name))) return;
  await page.getByRole("button", { name: "Scene 3: The handovers" }).click();
  await expect(page.locator("#movement")).toHaveAttribute("data-phase", "2");
  await page.locator(".cinema-webgl canvas").evaluate((canvas) => {
    (canvas as HTMLCanvasElement)
      .getContext("webgl2")
      ?.getExtension("WEBGL_lose_context")
      ?.loseContext();
  });
  await expect(page.locator("#movement")).toHaveClass(/cinema-static/);
  await expect(page.locator("#movement canvas")).toHaveCount(0);
  await expect(
    page.locator('#movement article[aria-hidden="false"]'),
  ).toHaveCount(4);
  await page
    .locator("#cargo-chapter-1")
    .getByRole("link", { name: "Explore the services" })
    .click();
  await expect(page).toHaveURL(/\/services/);
});

test("normal-motion page changes clean up the scene and preserve interactive interiors", async ({
  page,
}, info) => {
  test.setTimeout(90000); // Two independent scene initializations and route cleanup.
  if (!(await motionStory(page, info.project.name))) return;
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page
    .getByRole("link", { name: "Explore services", exact: true })
    .click();
  await expect(page).toHaveURL(/\/services/);
  await expect(page.locator(".cinema-webgl canvas")).toHaveCount(0);
  await page
    .getByRole("button", { name: "Storage & support", exact: true })
    .click();
  await expect(page.locator(".service-editorial")).toHaveCount(2);
  await page.getByRole("button", { name: "All services", exact: true }).click();
  await expect(page.locator(".service-editorial")).toHaveCount(5);
  await page
    .locator("header")
    .getByRole("link", { name: "Routeform Logistics concept home" })
    .click();
  await page.getByRole("button", { name: "Scene 1: The cargo" }).click();
  await expect(page.locator("#movement")).toHaveAttribute(
    "data-render-mode",
    "webgl",
    { timeout: 30000 },
  );
  await expect(page.locator(".cinema-webgl canvas")).toHaveCount(1);
  expect(errors).toEqual([]);
});
