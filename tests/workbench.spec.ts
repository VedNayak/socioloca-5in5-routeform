import { test, expect } from "@playwright/test";
import { cargoTotals } from "../src/CargoWorkbench";

test("cargo volume converts centimetres to cubic metres and totals identical pieces", () => {
  expect(
    cargoTotals({
      length: "120",
      width: "80",
      height: "100",
      pieces: "2",
      weight: "450",
    }),
  ).toEqual({ volume: 1.92, weight: 900, pieces: 2 });
  expect(
    cargoTotals({
      length: "",
      width: "80",
      height: "100",
      pieces: "2",
      weight: "NaN",
    }),
  ).toEqual({ volume: 0, weight: 0, pieces: 2 });
});

test("cargo geometry and totals respond to dimensions, with an accessible plan view", async ({
  page,
}) => {
  await page.goto("/quote/");
  await expect(page.getByTestId("cargo-volume")).toContainText("1.92");
  await expect(page.getByTestId("cargo-weight")).toContainText("900");
  const before = await page
    .locator(".cargo-geometry polygon")
    .first()
    .getAttribute("points");
  await page.getByLabel("Package length").fill("240");
  await page.getByLabel("Weight per piece").fill("600");
  await expect(page.getByTestId("cargo-volume")).toContainText("3.84");
  await expect(page.getByTestId("cargo-weight")).toContainText("1,200");
  expect(
    await page
      .locator(".cargo-geometry polygon")
      .first()
      .getAttribute("points"),
  ).not.toBe(before);
  await page.getByRole("button", { name: "Footprint", exact: true }).click();
  await expect(
    page.getByRole("img", { name: /Illustrative footprint cargo model/ }),
  ).toBeVisible();
  await page.getByRole("radio", { name: "Air freight" }).check();
  await expect(page.locator(".cargo-documents")).toContainText("Air waybill");
  await expect(page.locator(".cargo-documents")).not.toContainText(
    "Bill of lading",
  );
});

test("review revalidates dimensions changed after the cargo step", async ({
  page,
}) => {
  await page.goto("/quote");
  await page.getByLabel("Origin city").fill("Rotterdam");
  await page.getByLabel("Destination city").fill("Singapore");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByLabel("Cargo category").selectOption("General merchandise");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByLabel("Cargo-ready date").fill("2030-11-01");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByLabel("Full name").fill("Demo Visitor");
  await page.getByLabel("Company / organisation").fill("Example Company");
  await page.getByLabel("Email address").fill("demo@example.com");
  await page.getByLabel("Phone number").fill("+1234567890");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByLabel("Package length").fill("0");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Prepare demo brief" }).click();
  await expect(page.getByLabel("Package length")).toHaveAttribute(
    "aria-invalid",
    "true",
  );
  await expect(
    page.getByText("Nothing was transmitted.", { exact: true }),
  ).toHaveCount(0);
  await page.getByLabel("Package length").fill("120");
  await page.getByRole("button", { name: "Prepare demo brief" }).click();
  await expect(
    page.getByText("Nothing was transmitted.", { exact: true }),
  ).toBeVisible();
  await expect(page.getByLabel("Package length")).toBeDisabled();
});

test("five pages contain only the fictional identity and no real-business contact links", async ({
  page,
}) => {
  for (const route of [
    "/",
    "/services/",
    "/industries/",
    "/about/",
    "/quote/",
  ]) {
    await page.goto(route);
    await expect(page).toHaveTitle(/Routeform/);
    const text = await page.locator("body").innerText();
    expect(text).not.toMatch(/SASCO|1996|FZCO|JAFZA|Kwai Chung|2283888/i);
    const hrefs = await page
      .locator("a[href]")
      .evaluateAll((els) => els.map((el) => el.getAttribute("href")));
    expect(hrefs.join(" ")).not.toMatch(
      /sasco|routeformlogistics\.com|mailto:|tel:/i,
    );
    await expect(page.locator("footer")).toContainText(
      "fictional logistics brand",
    );
  }
});
