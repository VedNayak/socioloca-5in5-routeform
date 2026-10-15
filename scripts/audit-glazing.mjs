import { createServer } from "vite";
import * as T from "three";
import { writeFile } from "node:fs/promises";
const server = await createServer({
  server: { middlewareMode: true },
  optimizeDeps: { noDiscovery: true, include: [] },
});
try {
  const { createBodyModel } = await server.ssrLoadModule(
    "/src/freight/body-models.ts",
  );
  const { disposeVehicle } = await server.ssrLoadModule(
    "/src/freight/vehicles.ts",
  );
  const report = [];
  for (const id of [
    "home-road",
    "services-road",
    "industries-industrial",
    "industries-food",
  ]) {
    const model = createBodyModel(id);
    let panes = 0,
      maxGap = 0;
    model.root.traverse((o) => {
      const surface = o.userData.glazingSurface;
      if (!surface) return;
      panes++;
      if (
        o.geometry.type === "BoxGeometry" ||
        o.geometry.type === "RoundedBoxGeometry"
      )
        throw Error(id + ": volumetric glazing slab");
      const attr = o.geometry.attributes.position;
      for (let i = 0; i < attr.count; i++) {
        const p = new T.Vector3()
          .fromBufferAttribute(attr, i)
          .applyMatrix4(o.matrix);
        if (surface === "ellipsoid") {
          const y = p.y - 1.35,
            f = (p.x / 4.6) ** 2 + (y / 0.56) ** 2 + (p.z / 0.59) ** 2;
          const gradient = new T.Vector3(
            p.x / 4.6 ** 2,
            y / 0.56 ** 2,
            p.z / 0.59 ** 2,
          ).length();
          const gap = (f - 1) / (2 * gradient);
          if (gap < 0.0028 || gap > 0.0032)
            throw Error(id + ": glazing separated from hull");
          maxGap = Math.max(maxGap, gap);
        } else {
          if (p.y < 2.269 || p.y > 2.871)
            throw Error(id + ": pane exceeds cab panel vertically");
          if (
            surface === "cab-front" &&
            (Math.abs(p.x - 5.003) > 0.0001 || Math.abs(p.z) > 0.861)
          )
            throw Error(id + ": front pane exceeds flat cab face");
          if (
            surface === "cab-side" &&
            (p.x < 3.259 ||
              p.x > 4.601 ||
              Math.abs(Math.abs(p.z) - 1.103) > 0.0001)
          )
            throw Error(id + ": side pane exceeds flat cab face");
          maxGap = Math.max(maxGap, 0.003);
        }
      }
    });
    if (panes !== (id === "industries-food" ? 18 : 4))
      throw Error(id + ": unexpected glazing allocation");
    report.push({
      id,
      panes,
      maxSurfaceOffsetModelUnits: Number(maxGap.toFixed(6)),
      bounded: true,
    });
    model.root.traverse((o) => {
      if (o.isInstancedMesh) o.dispose();
    });
    disposeVehicle(model.root);
  }
  await writeFile("docs/glazing-checks.json", JSON.stringify(report, null, 2));
  console.log("All 30 panes are thin surfaces fitted to their vehicle bodies.");
} finally {
  await server.close();
}
