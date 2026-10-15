import { build } from "vite";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";
import { readFile, writeFile, mkdir, readdir } from "node:fs/promises";
const routes = [
  [
    "/",
    "Commerce, in motion.",
    "Explore Routeform Logistics services through an independent SocioLoca design concept.",
  ],
  [
    "/services",
    "A considered route for every cargo.",
    "A fictional freight service system, with illustrative planning guidance.",
  ],
  [
    "/industries",
    "Built around what you move.",
    "Illustrative logistics solutions for electronics, perishables, industrial cargo and trade.",
  ],
  [
    "/about",
    "Built around cargo. Connected by design.",
    "A fictional brand with a cargo-first philosophy and a connected operating model.",
  ],
  [
    "/quote",
    "Prepare your shipment brief.",
    "Local-only demonstration. No data is transmitted and no booking is created.",
  ],
  [
    "/404",
    "Route not found.",
    "Find your way back to the Routeform independent design concept.",
  ],
];
const files = await readdir("dist/assets");
const fonts = [
  files.find(
    (file) =>
      file.startsWith("manrope-latin-wght-normal-") && file.endsWith(".woff2"),
  ),
];
if (!fonts[0]) throw new Error("Variable Manrope font missing from the build.");
const preloads = fonts
  .map(
    (file) =>
      `<link rel="preload" href="/assets/${file}" as="font" type="font/woff2" crossorigin/>`,
  )
  .join("");
const output = await readFile("dist/index.html", "utf8");
const template = output.includes('<div id="root"></div>')
  ? output
  : await readFile("dist-ssr/index-template.html", "utf8");
const base = template
  .replace('<script type="module"', '<script type="module" fetchpriority="low"')
  .replace("</head>", `${preloads}</head>`);
await build({
  build: { ssr: "src/entry-server.tsx", outDir: "dist-ssr", emptyOutDir: true },
});
await writeFile("dist-ssr/index-template.html", template);
const { render } = await import(
  pathToFileURL(resolve("dist-ssr/entry-server.js")).href
);
const origin =
  process.env.SITE_URL ||
  "https://socioloca-5in5-routeform.ved-593.workers.dev";
for (const [route, title, description] of routes) {
  let html = base
    .replace('<div id="root"></div>', `<div id="root">${render(route)}</div>`)
    .replace(
      /<title>.*?<\/title>/,
      `<title>${title} | Routeform — Independent concept</title>`,
    )
    .replace(
      /<meta name="description" content="[^"]*"/,
      `<meta name="description" content="${description}"`,
    )
    .replace(
      /<meta property="og:title" content="[^"]*"/,
      `<meta property="og:title" content="${title} | Routeform — Independent concept"`,
    )
    .replace(
      /<meta property="og:description" content="[^"]*"/,
      `<meta property="og:description" content="${description}"`,
    );
  if (route === "/")
    html = html.replace(
      "</head>",
      '<link rel="preload" as="image" href="/images/cargo-cinema-mobile.avif" type="image/avif" media="(max-width: 820px)" fetchpriority="high"/><link rel="preload" as="image" href="/images/cargo-cinema.avif" type="image/avif" media="(min-width: 821px)" fetchpriority="high"/></head>',
    );
  if (["/services", "/industries", "/about", "/quote"].includes(route)) {
    const name = route.slice(1);
    html = html.replace(
      "</head>",
      `<link rel="preload" as="image" href="/images/opening-v6-${name}-mobile.avif" type="image/avif" media="(max-width: 820px)" fetchpriority="high"/><link rel="preload" as="image" href="/images/opening-v6-${name}.avif" type="image/avif" media="(min-width: 821px)" fetchpriority="high"/></head>`,
    );
    html = html.replace(
      'content="/images/cargo-cinema.webp"',
      `content="/images/opening-v6-${name}.webp"`,
    );
  }
  if (origin)
    html = html
      .replace(
        "</head>",
        `<link rel="canonical" href="${origin}${route === "/" ? "/" : route}"/><meta property="og:url" content="${origin}${route}"/></head>`,
      )
      .replace(
        'content="/images/cargo-cinema.webp"',
        `content="${origin}/images/cargo-cinema.webp"`,
      );
  if (origin)
    html = html.replace(
      /content="(\/images\/opening-[^"]+)"/,
      `content="${origin}$1"`,
    );
  const dest =
    route === "/"
      ? "dist/index.html"
      : route === "/404"
        ? "dist/404.html"
        : `dist${route}/index.html`;
  if (route !== "/" && route !== "/404")
    await mkdir(`dist${route}`, { recursive: true });
  await writeFile(dest, html);
}
await writeFile("dist/robots.txt", "User-agent: *\nDisallow: /\n");
if (origin)
  await writeFile(
    "dist/sitemap.xml",
    `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${routes
      .filter(([r]) => r !== "/404")
      .map(([r]) => `<url><loc>${origin}${r}</loc></url>`)
      .join("")}</urlset>`,
  );
console.log(
  "Prerendered all five routes and a useful 404. Concept remains noindex.",
);
