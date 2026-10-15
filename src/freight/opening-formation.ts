import * as T from "three";
import type { OpeningKind } from "./hero-study";

/** Sparse, original 3D destinations. Particles only bridge into these lines;
 * no point-cloud vehicle, floor lattice or environmental scaffolding remains. */
export function createOpeningFormation(kind: OpeningKind, bounds: T.Box3) {
  const centre = bounds.getCenter(new T.Vector3());
  const size = bounds.getSize(new T.Vector3());
  const radius = Math.max(size.x, size.y, size.z) * 0.36;
  const segments: [T.Vector3, T.Vector3][] = [],
    accents: [T.Vector3, T.Vector3][] = [];
  const v = (x: number, y: number, z: number) =>
    new T.Vector3(x, y, z).multiplyScalar(radius);
  const edge = (a: T.Vector3, b: T.Vector3, accent = false) =>
    (accent ? accents : segments).push([a, b]);
  const ring = (r: number, normal: T.Vector3, offset = 0, accent = false) => {
    const q = new T.Quaternion().setFromUnitVectors(
      new T.Vector3(0, 1, 0),
      normal.clone().normalize(),
    );
    const pts = Array.from({ length: 97 }, (_, i) =>
      new T.Vector3(
        Math.cos((i / 96) * Math.PI * 2) * r,
        offset,
        Math.sin((i / 96) * Math.PI * 2) * r,
      )
        .applyQuaternion(q)
        .multiplyScalar(radius),
    );
    for (let i = 0; i < 96; i++) edge(pts[i], pts[i + 1], accent);
    return new T.CatmullRomCurve3(pts.slice(0, -1), true);
  };
  const cube = (s: number) => {
    const pts = Array.from({ length: 8 }, (_, i) =>
      v((i & 1 ? 1 : -1) * s, (i & 2 ? 1 : -1) * s, (i & 4 ? 1 : -1) * s),
    );
    for (let i = 0; i < 8; i++)
      for (const bit of [1, 2, 4]) if (!(i & bit)) edge(pts[i], pts[i | bit]);
    return pts;
  };
  let orbit: T.CatmullRomCurve3 | undefined;
  if (kind === "services") {
    for (let i = 0; i < 4; i++)
      ring(
        1,
        new T.Vector3(
          Math.cos((i * Math.PI) / 4),
          0,
          Math.sin((i * Math.PI) / 4),
        ),
      );
    for (const y of [-0.55, 0, 0.55])
      ring(Math.sqrt(1 - y * y), new T.Vector3(0, 1, 0), y);
    orbit = ring(1.23, new T.Vector3(0.3, 1, 0.48), 0, true);
  } else if (kind === "industries") {
    const outer = cube(0.9),
      inner = cube(0.43);
    for (let i = 0; i < 8; i++) edge(outer[i], inner[i]);
    edge(outer[1], outer[3], true);
    edge(outer[3], outer[7], true);
    edge(outer[7], outer[5], true);
  } else if (kind === "about") {
    orbit = ring(1.13, new T.Vector3(0.15, 1, 0.25), 0, true);
    ring(1.04, new T.Vector3(0.15, 1, 0.25));
    const tips = [
      v(0.65, 0, 0),
      v(-0.65, 0, 0),
      v(0, 0.85, 0),
      v(0, -0.85, 0),
      v(0, 0, 0.65),
      v(0, 0, -0.65),
    ];
    for (const pole of [2, 3])
      for (const corner of [0, 4, 1, 5]) edge(tips[pole], tips[corner]);
    for (let i = 0; i < 4; i++) {
      const rim = [0, 4, 1, 5];
      edge(tips[rim[i]], tips[rim[(i + 1) % 4]]);
    }
  } else {
    const box = cube(0.85);
    // Three clean, highlighted dimensions; the single cuboid remains the subject.
    edge(box[0], box[1], true);
    edge(box[1], box[3], true);
    edge(box[1], box[5], true);
    for (const p of box) {
      const d = p
        .clone()
        .normalize()
        .multiplyScalar(0.07 * radius);
      edge(p.clone().sub(d), p.clone().add(d), true);
    }
  }
  const root = new T.Group();
  root.position.copy(centre);
  const material = new T.LineBasicMaterial({
    color: "#9db8b4",
    transparent: true,
    opacity: 0,
    depthWrite: false,
  });
  const accent = new T.LineBasicMaterial({
    color: "#ff9c72",
    transparent: true,
    opacity: 0,
    depthWrite: false,
  });
  const make = (edges: [T.Vector3, T.Vector3][], mat: T.LineBasicMaterial) =>
    new T.LineSegments(new T.BufferGeometry().setFromPoints(edges.flat()), mat);
  root.add(make(segments, material), make(accents, accent));
  const nodeMaterial = new T.MeshBasicMaterial({
    color: "#ffd4ad",
    transparent: true,
    opacity: 0,
    depthWrite: false,
  });
  const node = new T.Mesh(
    new T.SphereGeometry(radius * 0.023, 12, 8),
    nodeMaterial,
  );
  node.visible = !!orbit;
  root.add(node);
  const all = [...segments, ...accents];
  const lengths = all.map(([a, b]) => a.distanceTo(b));
  const total = lengths.reduce((a, b) => a + b, 0);
  const cumulative: number[] = [];
  let sum = 0;
  for (const length of lengths) {
    sum += length;
    cumulative.push(sum);
  }
  return {
    root,
    name: (
      {
        services: "orbital-sphere",
        industries: "modular-cube",
        about: "navigation-ring",
        quote: "dimension-cuboid",
      } as const
    )[kind],
    outline: all.flat().map((p) => p.clone().add(centre)),
    sample(t: number) {
      const distance = t * total;
      let lo = 0,
        hi = cumulative.length - 1;
      while (lo < hi) {
        const mid = (lo + hi) >> 1;
        if (cumulative[mid] < distance) lo = mid + 1;
        else hi = mid;
      }
      const i = lo;
      const previous = i ? cumulative[i - 1] : 0;
      return all[i][0]
        .clone()
        .lerp(all[i][1], (distance - previous) / lengths[i])
        .add(centre);
    },
    update(amount: number, time: number) {
      material.opacity = amount * 0.64;
      accent.opacity = amount * 0.82;
      nodeMaterial.opacity = amount * 0.8;
      if (orbit) orbit.getPointAt((time * 0.035) % 1, node.position);
      root.visible = amount > 0.001;
    },
  };
}
