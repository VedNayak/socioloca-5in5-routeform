// Render local fallbacks with the very same WebGL materials, camera and lighting.
import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
const browser = await chromium.launch({ channel: "chrome" });
try {
  const page = await browser.newPage({
    viewport: { width: 1100, height: 850 },
    deviceScaleFactor: 1,
  });
  await page.route("**/poster-output", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: '<html><body style="margin:0"></body></html>',
    }),
  );
  await page.goto("http://127.0.0.1:4175/poster-output");
  const studies = await page.evaluate(
    async () => (await import("/src/freight/body-studies.ts")).bodyStudies,
  );
  await mkdir("public/geometry/posters", { recursive: true });
  for (const [study, { kind }] of Object.entries(studies))
    for (const [size, width] of [
      ["compact", 480],
      ["wide", 960],
    ]) {
      if (process.argv[2] && !process.argv[2].split(",").includes(study))
        continue;
      const data = await page.evaluate(
        async ({ study, kind, width }) => {
          const { createAssemblyRenderer } =
            await import("/src/freight/assembly-renderer.ts");
          const host = document.createElement("div");
          Object.assign(host.style, {
            width: width + "px",
            height:
              width /
                (study === "home-air"
                  ? 1.12
                  : study === "home-road"
                    ? 1.3
                    : 1.5) +
              "px",
          });
          document.body.append(host);
          const engine = createAssemblyRenderer(host, kind, () => {}, study, {
            time: 0,
            yaw: 0,
            pitch: 0,
            technical: 0,
          });
          engine.pause(true);
          const image = engine.suspend().image;
          engine.dispose();
          host.remove();
          return image.split(",")[1];
        },
        { study, kind, width },
      );
      await writeFile(
        `public/geometry/posters/${study}-${size}.webp`,
        Buffer.from(data, "base64"),
      );
      console.log(study, size);
    }
} finally {
  await browser.close();
}
