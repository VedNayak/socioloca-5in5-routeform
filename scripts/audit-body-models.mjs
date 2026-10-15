import { createServer } from "vite";
import { createHash } from "node:crypto";
import { writeFile } from "node:fs/promises";
const server = await createServer({
  server: { middlewareMode: true },
  optimizeDeps: { noDiscovery: true, include: [] },
});
try {
  const { createBodyModel } = await server.ssrLoadModule(
    "/src/freight/body-models.ts",
  );
  const { bodyStudies } = await server.ssrLoadModule(
    "/src/freight/body-studies.ts",
  );
  const { disposeVehicle } = await server.ssrLoadModule(
    "/src/freight/vehicles.ts",
  );
  const report = [];
  for (const [id, detail] of Object.entries(bodyStudies)) {
    const model = createBodyModel(id),
      states = [];
    let meshes = 0,
      vertices = 0;
    for (const time of [0, 3, 6, 10, 14, 17]) {
      model.work(time);
      model.root.updateMatrixWorld(true);
      const values = [];
      model.root.traverse((object) => {
        if (!object.isMesh) return;
        if (!time) {
          meshes++;
          vertices += object.geometry.attributes.position.count;
        }
        values.push(
          object.geometry.attributes.position.count,
          ...object.matrixWorld.elements.map((n) => Number(n.toFixed(5))),
        );
        if (object.matrixWorld.elements.some((n) => !Number.isFinite(n)))
          throw Error(`${id}: non-finite transform`);
      });
      states.push(
        createHash("sha256").update(JSON.stringify(values)).digest("hex"),
      );
    }
    if (new Set(states).size < 3) throw Error(`${id}: frozen model`);
    report.push({
      id,
      ...detail,
      meshes,
      vertices,
      motionFingerprint: createHash("sha256")
        .update(states.join())
        .digest("hex"),
    });
    model.root.traverse((o) => {
      if (o.isInstancedMesh) o.dispose();
    });
    disposeVehicle(model.root);
  }
  if (new Set(report.map((r) => r.motionFingerprint)).size !== report.length)
    throw Error("Duplicate motion sequence");
  await writeFile(
    "docs/body-precision-model-audit.json",
    JSON.stringify(report, null, 2),
  );
  console.log(
    `${report.length} distinct model/action fingerprints; all transforms finite and moving.`,
  );
} finally {
  await server.close();
}
