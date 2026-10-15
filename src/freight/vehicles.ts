import * as T from "three";
export type VehicleKind = "ship" | "plane" | "truck" | "forklift" | "crate";
export type AssemblyPart = {
  group: T.Group;
  home: T.Vector3;
  column: number;
  row: number;
};

/** Original, symbolic cargo geometry. No company equipment or downloadable models. */
export function createVehicle(kind: VehicleKind) {
  const root = new T.Group(),
    parts: AssemblyPart[] = [];
  const rolling: T.Group[] = [],
    lifting: T.Group[] = [],
    fans: T.Group[] = [],
    gear: T.Group[] = [];
  const graphite = new T.MeshStandardMaterial({
    color: "#29383c",
    metalness: 0.6,
    roughness: 0.36,
  });
  const orange = new T.MeshStandardMaterial({
    color: "#ed713b",
    metalness: 0.35,
    roughness: 0.4,
  });
  const pale = new T.MeshStandardMaterial({
    color: "#deded3",
    metalness: 0.35,
    roughness: 0.4,
  });
  const glass = new T.MeshStandardMaterial({
    color: "#173a45",
    metalness: 0.75,
    roughness: 0.13,
  });
  const rubber = new T.MeshStandardMaterial({
    color: "#10191c",
    roughness: 0.88,
  });
  const wire = new T.LineBasicMaterial({
    color: "#e6be8e",
    transparent: true,
    opacity: 0.23,
  });
  const part = (
    geometry: T.BufferGeometry,
    material: T.Material,
    x: number,
    y: number,
    z: number,
    rx = 0,
    ry = 0,
    rz = 0,
  ) => {
    const group = new T.Group(),
      mesh = new T.Mesh(geometry, material);
    mesh.rotation.set(rx, ry, rz);
    group.add(mesh);
    const edge = new T.LineSegments(
      new T.EdgesGeometry(
        geometry,
        geometry.type === "SphereGeometry" ? 2 : 28,
      ),
      wire,
    );
    edge.rotation.copy(mesh.rotation);
    group.add(edge);
    group.position.set(x, y, z);
    root.add(group);
    parts.push({ group, home: group.position.clone(), column: x, row: z });
    return group;
  };
  const box = (
    w: number,
    h: number,
    d: number,
    mat: T.Material,
    x: number,
    y: number,
    z: number,
    ry = 0,
  ) => part(new T.BoxGeometry(w, h, d), mat, x, y, z, 0, ry);
  const wheel = (
    radius: number,
    depth: number,
    x: number,
    y: number,
    z: number,
  ) => {
    rolling.push(
      part(
        new T.CylinderGeometry(radius, radius, depth, 20),
        rubber,
        x,
        y,
        z,
        Math.PI / 2,
      ),
    );
    rolling.push(
      part(
        new T.CylinderGeometry(radius * 0.45, radius * 0.45, depth + 0.015, 16),
        pale,
        x,
        y,
        z,
        Math.PI / 2,
      ),
    );
    // An asymmetric spoke makes wheel rotation visible, rather than spinning a featureless disc.
    rolling.push(
      box(radius * 1.25, radius * 0.13, depth + 0.03, orange, x, y, z),
    );
  };
  if (kind === "ship") {
    // A tapered bow/stern, keel, working deck and container stacks.
    const outline = new T.Shape();
    outline.moveTo(-7, 0);
    outline.lineTo(-5.5, -1.7);
    outline.lineTo(4.9, -1.7);
    outline.quadraticCurveTo(6.9, -1.45, 7.6, 0);
    outline.quadraticCurveTo(6.9, 1.45, 4.9, 1.7);
    outline.lineTo(-5.5, 1.7);
    outline.closePath();
    const hull = new T.ExtrudeGeometry(outline, {
      depth: 1.35,
      bevelEnabled: true,
      bevelSegments: 2,
      steps: 1,
      bevelSize: 0.16,
      bevelThickness: 0.16,
    });
    hull.rotateX(-Math.PI / 2);
    hull.translate(0, -0.675, 0);
    part(hull, graphite, 0, 0.82, 0);
    box(10.8, 0.12, 3.3, pale, -0.1, 1.62, 0);
    for (let c = 0; c < 7; c++)
      for (let r = 0; r < 3; r++)
        for (let layer = 0; layer < (c % 3 === 0 ? 1 : 2); layer++) {
          const x = -3.7 + c * 1.33,
            z = -1.07 + r * 1.07,
            y = 2.04 + layer * 0.81;
          box(
            1.28,
            0.77,
            1.01,
            (c + r + layer) % 3 === 0 ? orange : pale,
            x,
            y,
            z,
          );
          for (let rib = 0; rib < 5; rib++)
            box(0.018, 0.7, 1.022, graphite, x - 0.52 + rib * 0.26, y, z);
        }
    box(1.55, 1.6, 2.5, pale, -5.25, 2.38, 0);
    box(1.75, 0.58, 2.75, pale, -5.25, 3.48, 0);
    box(0.08, 0.22, 2.76, glass, -4.33, 3.52, 0);
    box(0.55, 1.0, 0.75, orange, -5.55, 4.06, 0);
    box(0.05, 1.3, 0.05, pale, -5.08, 4.4, 0);
  } else if (kind === "plane") {
    // Longitudinal x-axis: nose +x, swept wings and horizontal/vertical tail.
    const fuselage = new T.SphereGeometry(1, 40, 20);
    fuselage.scale(6.5, 0.68, 0.72);
    part(fuselage, pale, 0, 1.1, 0);
    const wing = (positive: boolean, tail = false) => {
      const sign = positive ? 1 : -1,
        x = tail ? -4.5 : 0.4,
        span = tail ? 3.1 : 7.7;
      const shape = new T.Shape();
      shape.moveTo(x + (tail ? 0.8 : 1.7), 0);
      shape.lineTo(x - (tail ? 0.3 : 2.5), span * sign);
      shape.lineTo(x - (tail ? 1.2 : 3.0), span * sign);
      shape.lineTo(x - (tail ? 1.5 : 1.8), 0);
      shape.closePath();
      const g = new T.ExtrudeGeometry(shape, {
        depth: tail ? 0.08 : 0.12,
        bevelEnabled: false,
      });
      g.rotateX(Math.PI / 2);
      g.translate(0, 0.06, 0);
      part(g, pale, 0, tail ? 1.28 : 1, 0);
    };
    wing(true);
    wing(false);
    wing(true, true);
    wing(false, true);
    const fin = new T.Shape();
    fin.moveTo(-5.6, 0);
    fin.lineTo(-5.2, 2.75);
    fin.lineTo(-4.55, 2.75);
    fin.lineTo(-3.5, 0);
    fin.closePath();
    const finG = new T.ExtrudeGeometry(fin, {
      depth: 0.1,
      bevelEnabled: false,
    });
    finG.translate(0, 0, -0.05);
    part(finG, orange, 0, 1.55, 0);
    for (const z of [-3.0, 3.0]) {
      part(
        new T.CylinderGeometry(0.47, 0.39, 1.55, 24),
        graphite,
        0.05,
        0.53,
        z,
        0,
        0,
        Math.PI / 2,
      );
      for (let blade = 0; blade < 6; blade++) {
        const fan = box(0.03, 0.63, 0.035, pale, 0.92, 0.53, z);
        fan.rotation.x = (blade * Math.PI) / 6;
        fans.push(fan);
      }
      part(
        new T.CylinderGeometry(0.35, 0.35, 0.09, 24),
        rubber,
        0.86,
        0.53,
        z,
        0,
        0,
        Math.PI / 2,
      );
    }
    box(0.75, 0.14, 0.86, glass, 5.0, 1.61, 0);
    for (const x of [-2.25, 0.6, 4.35])
      for (const z of [-0.45, 0.45]) {
        const start = parts.length;
        box(0.08, 0.65, 0.08, graphite, x, 0.55, z);
        wheel(0.23, 0.13, x, 0.23, z);
        gear.push(...parts.slice(start).map((p) => p.group));
      }
  } else if (kind === "truck") {
    box(10.5, 0.35, 1.9, graphite, -0.1, 0.75, 0);
    box(7.4, 2.35, 2.1, orange, -1.5, 2.1, 0);
    for (let i = 0; i < 32; i++)
      box(0.045, 2.2, 2.13, orange, -5.1 + i * 0.23, 2.1, 0);
    box(2.3, 1.95, 2.2, pale, 3.8, 1.97, 0);
    box(0.13, 0.85, 1.98, glass, 4.94, 2.55, 0);
    box(1.65, 0.77, 0.05, glass, 3.85, 2.55, 1.12);
    box(1.65, 0.77, 0.05, glass, 3.85, 2.55, -1.12);
    box(0.12, 0.38, 2.3, graphite, 5, 1.16, 0);
    for (const x of [-4.2, -3.15, 1.7, 4.2])
      for (const z of [-1.07, 1.07]) wheel(0.53, 0.3, x, 0.54, z);
  } else if (kind === "forklift") {
    box(2.35, 1.05, 1.7, orange, -0.25, 0.83, 0);
    box(0.75, 0.65, 1.65, orange, -1.17, 1.58, 0);
    box(0.52, 0.34, 0.65, rubber, -0.27, 1.61, 0);
    box(0.24, 0.66, 0.65, rubber, -0.55, 1.91, 0);
    for (const x of [-0.97, 0.71])
      for (const z of [-0.75, 0.75]) box(0.1, 1.86, 0.1, graphite, x, 2.07, z);
    box(1.94, 0.12, 1.73, graphite, -0.12, 3.06, 0);
    for (const z of [-0.63, 0.63]) {
      box(0.13, 3.35, 0.17, graphite, 1.2, 1.85, z);
      lifting.push(box(1.78, 0.09, 0.21, pale, 2.12, 0.4, z));
    }
    lifting.push(box(0.15, 0.42, 1.6, graphite, 1.35, 0.67, 0));
    // A supported pallet and four cartons travel with the actual carriage and forks.
    for (const z of [-0.58, 0, 0.58])
      lifting.push(box(1.65, 0.12, 0.19, pale, 2.2, 0.52, z));
    lifting.push(box(1.65, 0.08, 1.55, pale, 2.2, 0.62, 0));
    for (const x of [1.8, 2.6])
      for (const z of [-0.39, 0.39]) {
        lifting.push(box(0.75, 0.92, 0.72, pale, x, 1.12, z));
        lifting.push(box(0.035, 0.94, 0.74, orange, x, 1.12, z));
      }
    for (const x of [-0.98, 0.83])
      for (const z of [-0.9, 0.9])
        wheel(x < 0 ? 0.38 : 0.51, 0.23, x, x < 0 ? 0.39 : 0.52, z);
    box(0.025, 0.18, 0.3, pale, 0.49, 2.42, 0);
  } else {
    box(3.8, 2.5, 2.8, pale, 0, 1.66, 0);
    for (const x of [-1.1, 1.1]) box(0.09, 2.54, 2.84, orange, x, 1.66, 0);
    for (const x of [-1.8, 1.8]) box(0.15, 2.5, 2.84, pale, x, 1.66, 0);
    for (const y of [0.49, 2.83]) box(3.8, 0.15, 2.84, pale, 0, y, 0);
    for (const z of [-1.08, 0, 1.08]) box(4, 0.22, 0.25, graphite, 0, 0.19, z);
    for (const x of [-1.5, 0, 1.5]) box(0.35, 0.3, 3, pale, x, 0.37, 0);
  }
  root.updateMatrixWorld(true);
  const bounds = new T.Box3().setFromObject(root),
    centre = bounds.getCenter(new T.Vector3()),
    size = bounds.getSize(new T.Vector3());
  // Normalize camera fit while retaining real proportions, then use spatial coordinates for the rise wave.
  const span = Math.max(size.x, size.z),
    scale = 12 / span;
  root.scale.setScalar(scale);
  root.position.set(
    -centre.x * scale,
    -bounds.min.y * scale,
    -centre.z * scale,
  );
  const minX = Math.min(...parts.map((p) => p.home.x)),
    maxX = Math.max(...parts.map((p) => p.home.x));
  const minZ = Math.min(...parts.map((p) => p.home.z)),
    maxZ = Math.max(...parts.map((p) => p.home.z));
  parts.forEach((p) => {
    p.column = ((p.home.x - minX) / Math.max(0.01, maxX - minX)) * 17;
    p.row = ((p.home.z - minZ) / Math.max(0.01, maxZ - minZ)) * 11;
  });
  const rest = root.position.clone();
  const moving = new T.Group();
  const glow = new T.MeshBasicMaterial({
    color: "#ee8149",
    transparent: true,
    opacity: 0.5,
    depthWrite: false,
  });
  const tracks: T.Object3D[] = [];
  if (kind === "truck" || kind === "plane") {
    for (let i = 0; i < 14; i++) {
      const mark = new T.Mesh(new T.BoxGeometry(0.85, 0.02, 0.05), glow);
      mark.position.set(-9 + i * 1.35, 0, kind === "truck" ? 2.6 : 5.2);
      moving.add(mark);
      tracks.push(mark);
    }
  } else if (kind === "ship") {
    const wakeMaterial = new T.LineBasicMaterial({
      color: "#97c8d0",
      transparent: true,
      opacity: 0.4,
    });
    for (let i = 0; i < 7; i++) {
      const l = new T.Line(
        new T.BufferGeometry().setFromPoints([
          new T.Vector3(-8, 0, -1.6 - i * 0.14),
          new T.Vector3(-11 - i * 0.2, 0, -2.8 - i * 0.28),
          new T.Vector3(-11 - i * 0.2, 0, 2.8 + i * 0.28),
          new T.Vector3(-8, 0, 1.6 + i * 0.14),
        ]),
        wakeMaterial,
      );
      moving.add(l);
      tracks.push(l);
    }
  } else if (kind === "crate") {
    const scan = new T.Mesh(
      new T.PlaneGeometry(2.9, 2.65),
      new T.MeshBasicMaterial({
        color: "#ee8149",
        transparent: true,
        opacity: 0.22,
        side: T.DoubleSide,
        depthWrite: false,
      }),
    );
    scan.rotation.y = Math.PI / 2;
    scan.position.y = 1.8;
    moving.add(scan);
    tracks.push(scan);
    for (let i = 0; i < 9; i++) {
      const roller = part(
        new T.CylinderGeometry(0.13, 0.13, 3.6, 12),
        graphite,
        -2.3 + i * 0.57,
        -0.09,
        0,
        Math.PI / 2,
      );
      rolling.push(roller);
    }
  }
  root.add(moving);
  if (kind !== "truck" && kind !== "plane") glow.dispose();
  const homes = new Map(parts.map((p) => [p.group, p.home]));
  const smooth = (v: number) => {
    const c = Math.max(0, Math.min(1, v));
    return c * c * (3 - 2 * c);
  };
  function work(time: number, amount = 1) {
    root.position.copy(rest);
    root.rotation.set(0, 0, 0);
    moving.visible = amount > 0.01;
    rolling.forEach((w) => (w.rotation.z = -time * 2.6 * amount));
    if (kind === "forklift") {
      const cycle = time % 12;
      const lift =
        (smooth(cycle / 2) - smooth((cycle - 6) / 2)) * 1.28 * amount;
      lifting.forEach((g) => {
        g.position.y = (homes.get(g)?.y ?? 0) + lift;
      });
      const travel =
        (smooth((cycle - 2) / 3) - smooth((cycle - 8) / 3)) * 0.7 * amount;
      root.position.x += travel;
      rolling.forEach((w) => (w.rotation.z = -travel / scale / 0.48));
    } else if (kind === "ship") {
      root.position.y += Math.sin(time * 0.8) * 0.055 * amount;
      root.rotation.x = Math.sin(time * 0.6) * 0.012 * amount;
      root.rotation.z = Math.sin(time * 0.8) * 0.006 * amount;
      tracks.forEach((l, i) => {
        l.position.x = -(time * 0.6 + i * 0.15) % 1.7;
        l.position.y = Math.sin(time + i) * 0.035;
      });
    } else if (kind === "plane") {
      fans.forEach(
        (f, i) => (f.rotation.x = ((i % 6) * Math.PI) / 6 + time * 12 * amount),
      );
      const takeoff =
        smooth(((time % 16) - 2) / 4) *
        (1 - smooth(((time % 16) - 11) / 4)) *
        amount;
      root.position.y += takeoff * 0.8;
      root.rotation.z = takeoff * 0.025;
      if (amount > 0.01)
        gear.forEach((g) => {
          g.position.y = (homes.get(g)?.y ?? 0) + takeoff * 0.38;
          g.scale.setScalar(1 - takeoff * 0.55);
        });
    } else if (kind === "truck")
      root.position.y += Math.sin(time * 7) * 0.015 * amount;
    if (kind === "truck" || kind === "plane")
      tracks.forEach(
        (l, i) => (l.position.x = 9 - ((time * 2 + i * 1.35) % 18)),
      );
    if (kind === "crate") tracks[0].position.x = -2.1 + ((time % 5) / 5) * 4.2;
  }
  return { root, parts, wire, scale, height: size.y * scale, work, moving };
}

export function disposeVehicle(root: T.Object3D) {
  const geometry = new Set<T.BufferGeometry>(),
    materials = new Set<T.Material>();
  root.traverse((o) => {
    if (o instanceof T.Mesh || o instanceof T.Line) {
      geometry.add(o.geometry);
      for (const m of Array.isArray(o.material) ? o.material : [o.material])
        materials.add(m);
    }
  });
  geometry.forEach((g) => g.dispose());
  materials.forEach((m) => m.dispose());
}
