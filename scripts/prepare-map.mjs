import { readFile, writeFile } from "node:fs/promises";
import { feature } from "topojson-client";
import { geoNaturalEarth1, geoPath } from "d3-geo";
const world = JSON.parse(
  await readFile("node_modules/world-atlas/countries-110m.json", "utf8"),
);
const land = feature(world, world.objects.countries);
const projection = geoNaturalEarth1().scale(183).translate([565, 298]);
const d = geoPath(projection)(land);
await writeFile(
  "public/images/world-map.svg",
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1130 570"><path d="${d}" fill="#273741" stroke="#43525a" stroke-width=".4"/></svg>`,
);
console.log(
  "Prepared geographic backdrop; projection matches interactive route coordinates.",
);
