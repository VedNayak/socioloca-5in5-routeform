import { geoEquirectangular, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import { readFile, writeFile } from "node:fs/promises";
import sharp from "sharp";
const topology = JSON.parse(
  await readFile("node_modules/world-atlas/land-110m.json", "utf8"),
);
const land = feature(topology, topology.objects.land);
const projection = geoEquirectangular()
  .scale(512 / (2 * Math.PI))
  .translate([256, 128]);
const path = geoPath(projection)(land);
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="256"><rect width="512" height="256" fill="black"/><path d="${path}" fill="white"/></svg>`;
await sharp(Buffer.from(svg)).png().toFile("public/images/globe-land-mask.png");
await writeFile("public/images/globe-land-mask.svg", svg);
console.log(
  "Prepared licensed Natural Earth land mask for the original 3D globe.",
);
