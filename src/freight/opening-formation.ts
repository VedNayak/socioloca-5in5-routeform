import * as T from "three";
import type { OpeningKind } from "./hero-study";

/** The final particle destination for each internal opening, equivalent to
 * Home's globe: a scanned point-cloud twin of the subject standing on a
 * lattice of its working ground, plus one illustrative orange path. Original
 * coded geometry; no operating data, equipment or locations are implied. */
export function createOpeningFormation(
  kind: OpeningKind,
  bounds: T.Box3,
  mobile: boolean,
) {
  const centre = bounds.getCenter(new T.Vector3()),
    size = bounds.getSize(new T.Vector3()),
    { min, max } = bounds;
  // The ship floats: its working ground is the water line, not the keel.
  const groundY = kind === "about" ? min.y + size.y * 0.09 : min.y - 0.01;
  // Phones keep the whole formation between the copy and the controls, so the
  // ground and paths stay closer to the subject.
  const reach = mobile ? 0.28 : 1,
    radius = Math.max(size.x, size.z) * (mobile ? 0.62 : 1.3),
    spacing = mobile ? 0.34 : 0.38;
  const ground: { point: T.Vector3; fade: number }[] = [];
  for (let x = -radius; x <= radius; x += spacing)
    for (let z = -radius; z <= radius; z += spacing) {
      const d = Math.hypot(x, z) / radius;
      if (d > 1) continue;
      ground.push({
        point: new T.Vector3(centre.x + x, groundY, centre.z + z),
        fade: 1 - T.MathUtils.smoothstep(d, 0.35, 1),
      });
    }
  // Interleave the lattice so a partial allocation still covers the whole disc.
  for (let i = ground.length - 1, seed = 41; i > 0; i--) {
    seed = (seed * 16807) % 2147483647;
    const j = seed % (i + 1);
    [ground[i], ground[j]] = [ground[j], ground[i]];
  }
  const v = (x: number, y: number, z: number) => new T.Vector3(x, y, z);
  let path: T.CatmullRomCurve3 | undefined;
  const lines: T.Vector3[][] = [];
  if (kind === "services")
    // An illustrative departure climbing away from the nose.
    path = new T.CatmullRomCurve3([
      v(max.x - 0.2, centre.y, centre.z),
      v(max.x + 4 * reach, centre.y + 0.35 * reach, centre.z - 0.4 * reach),
      v(max.x + 9 * reach, centre.y + 2.4 * reach, centre.z - 2 * reach),
      v(max.x + 14 * reach, centre.y + 6 * reach, centre.z - 4.4 * reach),
    ]);
  else if (kind === "industries") {
    // Forks lead out of a wire racking bay and turn along the front aisle.
    path = new T.CatmullRomCurve3(
      [
        v(max.x + 0.3, groundY + 0.02, centre.z),
        v(max.x + 1.6, groundY + 0.02, centre.z),
        v(max.x + 2.1, groundY + 0.02, centre.z + 1.1),
        v(max.x + 2.1, groundY + 0.02, centre.z + 1.1 + 3.5 * reach),
      ],
      false,
      "centripetal",
    );
    const rackZ = centre.z - (mobile ? 3.4 : 6.4),
      height = size.y * 1.1;
    for (let x = centre.x - 5; x <= max.x + 3.1; x += 2.7)
      for (const z of [rackZ - 0.55, rackZ + 0.55])
        lines.push([v(x, groundY, z), v(x, groundY + height, z)]);
    for (let level = 0; level <= 3; level++) {
      const y = groundY + 0.12 + (level * height) / 3;
      for (const z of [rackZ - 0.55, rackZ + 0.55])
        lines.push([v(centre.x - 5, y, z), v(max.x + 3.1, y, z)]);
    }
  } else if (kind === "about")
    // A sea lane leaves the bow and bends across the swell.
    path = new T.CatmullRomCurve3([
      v(max.x + 0.4, groundY + 0.02, centre.z),
      v(max.x + 4 * reach, groundY + 0.02, centre.z + 0.8 * reach),
      v(max.x + 9 * reach, groundY + 0.02, centre.z + 0.2 * reach),
      v(max.x + 14 * reach, groundY + 0.02, centre.z - 3.5 * reach),
      v(max.x + 19 * reach, groundY + 0.02, centre.z - 9 * reach),
    ]);
  else {
    // Dimension brackets only; no measured values are shown or implied.
    const o = 0.55,
      tick = 0.28,
      y0 = groundY + 0.02;
    const bracket = (a: T.Vector3, b: T.Vector3, across: T.Vector3) => {
      lines.push([a, b]);
      for (const end of [a, b])
        lines.push([
          end.clone().addScaledVector(across, -tick),
          end.clone().addScaledVector(across, tick),
        ]);
    };
    bracket(v(min.x, y0, max.z + o), v(max.x, y0, max.z + o), v(0, 0, 1));
    bracket(v(max.x + o, y0, min.z), v(max.x + o, y0, max.z), v(1, 0, 0));
    bracket(
      v(max.x + o, min.y, max.z + o),
      v(max.x + o, max.y, max.z + o),
      v(1, 0, -1).normalize(),
    );
  }
  const root = new T.Group();
  const material = new T.LineBasicMaterial({
    color: "#ff6331",
    transparent: true,
    opacity: 0,
    depthWrite: false,
  });
  const wire = new T.LineBasicMaterial({
    color: "#819d9d",
    transparent: true,
    opacity: 0,
    depthWrite: false,
  });
  if (path)
    root.add(
      new T.Line(
        new T.BufferGeometry().setFromPoints(path.getSpacedPoints(160)),
        material,
      ),
    );
  if (lines.length)
    root.add(
      new T.LineSegments(
        new T.BufferGeometry().setFromPoints(lines.flat()),
        kind === "quote" ? material : wire,
      ),
    );
  const nodeMaterial = new T.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0,
    depthWrite: false,
  });
  const node = new T.Mesh(new T.SphereGeometry(0.09, 12, 8), nodeMaterial);
  node.visible = !!path;
  root.add(node);
  // The scan sweeps along the subject's length; the crate is scanned upwards.
  const scanAxis = kind === "quote" ? 1 : 0,
    scanFrom = (scanAxis ? min.y : min.x) - 1.2,
    scanTo = (scanAxis ? max.y : max.x) + 1.2;
  return {
    root,
    /** Everything drawn besides particles, for framing the finished scene. */
    outline: [...(path?.getSpacedPoints(24) ?? []), ...lines.flat()],
    ground,
    groundY,
    path,
    scanAxis,
    wave: kind === "about" ? 1 : 0,
    scan: (time: number) =>
      scanFrom + (scanTo - scanFrom) * ((time * 0.16) % 1),
    update(amount: number, time: number) {
      material.opacity = amount * 0.85;
      wire.opacity = amount * 0.32;
      nodeMaterial.opacity = amount;
      if (path) path.getPointAt((time * 0.07) % 1, node.position);
    },
  };
}
