// Original coded meshes projected at the live renderer's resting camera. No raster output.
import { createServer } from "vite";
import * as T from "three";
import { mkdir, writeFile } from "node:fs/promises";
const server = await createServer({ server: { middlewareMode: true } });
const { createVehicle, disposeVehicle } = await server.ssrLoadModule(
  "/src/freight/vehicles.ts",
);
const { camera } = await server.ssrLoadModule(
  "/src/components/ui/skyline-math.ts",
);
await mkdir("public/geometry", { recursive: true });
for (const kind of ["ship", "plane", "truck", "forklift", "crate"]) {
  const vehicle = createVehicle(kind),
    cam = new T.OrthographicCamera(
      (-8 * 640) / 440,
      (8 * 640) / 440,
      8,
      -8,
      0.1,
      150,
    );
  const c = camera(1);
  cam.position.set(
    c.sn * c.ce * 28,
    c.se * 28 + vehicle.height * 0.28,
    c.cs * c.ce * 28,
  );
  cam.lookAt(0, vehicle.height * 0.34, 0);
  cam.updateMatrixWorld();
  vehicle.root.updateMatrixWorld(true);
  const project = (v) => {
    const p = v.clone().project(cam);
    return `${((p.x + 1) * 320).toFixed(1)},${((1 - p.y) * 220).toFixed(1)}`;
  };
  let grid = "";
  for (let i = -10; i <= 10; i++) {
    grid += `<path d="M${project(new T.Vector3(i, -0.1, -10))}L${project(new T.Vector3(i, -0.1, 10))}M${project(new T.Vector3(-10, -0.1, i))}L${project(new T.Vector3(10, -0.1, i))}"/>`;
  }
  const triangles = [],
    eye = new T.Vector3();
  cam.getWorldDirection(eye);
  const key = new T.Vector3(5, 14, 8).normalize();
  vehicle.root.traverse((o) => {
    if (!o.isMesh || !o.visible || o.parent === vehicle.moving) return;
    const attr = o.geometry.attributes.position,
      index = o.geometry.index;
    for (let j = 0; j < (index?.count ?? attr.count); j += 3) {
      const v = [0, 1, 2].map((k) =>
        new T.Vector3()
          .fromBufferAttribute(attr, index ? index.getX(j + k) : j + k)
          .applyMatrix4(o.matrixWorld),
      );
      const normal = v[1]
        .clone()
        .sub(v[0])
        .cross(v[2].clone().sub(v[0]))
        .normalize();
      if (normal.dot(eye) >= 0) continue;
      const material = Array.isArray(o.material) ? o.material[0] : o.material;
      const color = material.color
        .clone()
        .multiplyScalar(0.58 + Math.max(0, normal.dot(key)) * 0.95);
      triangles.push({
        depth:
          v.reduce(
            (sum, p) => sum + p.clone().applyMatrix4(cam.matrixWorldInverse).z,
            0,
          ) / 3,
        color: "#" + color.getHexString(),
        path: `M${project(v[0])}L${project(v[1])}L${project(v[2])}Z`,
      });
    }
  });
  triangles.sort((a, b) => a.depth - b.depth);
  // Merge adjacent triangles with identical colour without changing painter order.
  const paths = [];
  for (const tri of triangles) {
    if (paths.at(-1)?.color === tri.color) paths.at(-1).path += tri.path;
    else paths.push({ ...tri });
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 440"><g id="study"><g fill="none" stroke="#294143" stroke-width=".7">${grid}</g>${paths.map((p) => `<path fill="${p.color}" d="${p.path}"/>`).join("")}</g></svg>`;
  await writeFile(`public/geometry/${kind}.svg`, svg);
  console.log(kind, svg.length, "bytes");
  disposeVehicle(vehicle.root);
}
await server.close();
