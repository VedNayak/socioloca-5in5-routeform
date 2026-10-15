import * as T from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

import type { BodyStudy } from "./body-studies";
const smooth = (a: number, b: number, x: number) =>
  T.MathUtils.smoothstep(x, a, b);
const pulse = (x: number, a: number, b: number, c: number, d: number) =>
  smooth(a, b, x) * (1 - smooth(c, d, x));

/** Original body-only equipment. Hero renderers deliberately retain vehicles.ts. */
export function createBodyModel(id: BodyStudy) {
  const root = new T.Group(),
    moving = new T.Group();
  root.add(moving);
  const paint = new T.MeshPhysicalMaterial({
    color: "#dce0d5",
    roughness: 0.29,
    metalness: 0.18,
    clearcoat: 0.4,
  });
  const orange = new T.MeshPhysicalMaterial({
    color: "#ee7139",
    roughness: 0.32,
    metalness: 0.32,
    clearcoat: 0.35,
  });
  const metal = new T.MeshStandardMaterial({
    color: "#52686b",
    metalness: 0.86,
    roughness: 0.26,
  });
  const dark = new T.MeshStandardMaterial({
    color: "#142329",
    metalness: 0.42,
    roughness: 0.36,
    side: T.DoubleSide,
  });
  const rubber = new T.MeshStandardMaterial({
    color: "#101819",
    roughness: 0.9,
  });
  const glass = new T.MeshPhysicalMaterial({
    color: "#122e36",
    metalness: 0.6,
    roughness: 0.08,
    clearcoat: 1,
  });
  const wood = new T.MeshStandardMaterial({
    color: "#a69572",
    roughness: 0.81,
  });
  const glow = new T.MeshBasicMaterial({ color: "#ffbd7d" });
  const wire = new T.LineBasicMaterial({
    color: "#adc9c4",
    transparent: true,
    opacity: 0,
    depthWrite: false,
  });
  const seams = new T.LineBasicMaterial({
    color: "#546c6c",
    transparent: true,
    opacity: 0.38,
  });
  const materialSet = [paint, orange, metal, dark, rubber, glass, wood];
  const ticks: ((t: number) => void)[] = [];
  const mesh = (
    g: T.BufferGeometry,
    m: T.Material = paint,
    parent: T.Object3D = moving,
  ) => {
    const o = new T.Mesh(g, m);
    o.castShadow = true;
    o.receiveShadow = true;
    parent.add(o);
    return o;
  };
  const box = (
    w: number,
    h: number,
    d: number,
    x: number,
    y: number,
    z: number,
    m: T.Material = paint,
    parent: T.Object3D = moving,
    radius = 0.035,
  ) => {
    const o = mesh(
      Math.min(w, h, d) < 0.12
        ? new T.BoxGeometry(w, h, d)
        : new RoundedBoxGeometry(
            w,
            h,
            d,
            2,
            Math.min(radius, w / 5, h / 5, d / 5),
          ),
      m,
      parent,
    );
    o.position.set(x, y, z);
    o.castShadow = Math.min(w, h, d) > 0.08;
    return o;
  };
  const line = (
    points: number[][],
    parent: T.Object3D = moving,
    mat: T.LineBasicMaterial = seams,
  ) => {
    const o = new T.Line(
      new T.BufferGeometry().setFromPoints(
        points.map((p) => new T.Vector3(...(p as [number, number, number]))),
      ),
      mat,
    );
    parent.add(o);
    return o;
  };
  const cyl = (
    r: number,
    length: number,
    x: number,
    y: number,
    z: number,
    m: T.Material = metal,
    parent: T.Object3D = moving,
    axis: "x" | "y" | "z" = "y",
  ) => {
    const o = mesh(new T.CylinderGeometry(r, r, length, 24), m, parent);
    o.position.set(x, y, z);
    if (axis === "x") o.rotation.z = Math.PI / 2;
    if (axis === "z") o.rotation.x = Math.PI / 2;
    return o;
  };
  const wheel = (
    x: number,
    y: number,
    z: number,
    r: number,
    parent: T.Object3D = moving,
  ) => {
    const g = new T.Group();
    g.position.set(x, y, z);
    parent.add(g);
    const tire = mesh(
      new T.TorusGeometry(r * 0.74, r * 0.26, 12, 32),
      rubber,
      g,
    );
    tire.scale.z = 0.85;
    cyl(r * 0.52, r * 0.49, 0, 0, 0, metal, g, "z");
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3;
      cyl(
        r * 0.055,
        r * 0.52,
        Math.sin(a) * r * 0.3,
        Math.cos(a) * r * 0.3,
        0,
        paint,
        g,
        "z",
      );
    }
    box(r * 0.7, r * 0.07, r * 0.52, 0, 0, 0, orange, g);
    return g;
  };
  const pallet = (parent: T.Object3D = moving, chilled = false) => {
    const g = new T.Group();
    parent.add(g);
    for (const z of [-0.55, 0, 0.55]) box(1.6, 0.12, 0.15, 0, 0.08, z, wood, g);
    for (let i = 0; i < 7; i++)
      box(0.18, 0.07, 1.3, -0.66 + i * 0.22, 0.19, 0, wood, g);
    for (const x of [-0.4, 0.4])
      for (const z of [-0.32, 0.32]) {
        box(0.75, 0.75, 0.6, x, 0.61, z, chilled ? paint : wood, g);
        box(0.77, 0.025, 0.015, x, 0.69, z + 0.305, orange, g);
        box(0.22, 0.16, 0.012, x, 0.73, z + 0.32, paint, g);
        for (let i = 0; i < 5; i++)
          box(0.009, 0.1, 0.015, x - 0.06 + i * 0.025, 0.73, z + 0.33, dark, g);
      }
    for (const x of [-0.55, 0.55])
      box(0.025, 0.82, 1.27, x, 0.62, 0, orange, g);
    return g;
  };
  const rack = (
    x: number,
    z: number,
    parent: T.Object3D = moving,
    width = 3.5,
  ) => {
    for (const px of [x - width / 2, x + width / 2])
      for (const pz of [z - 0.65, z + 0.65]) {
        box(0.1, 4.5, 0.1, px, 2.25, pz, metal, parent);
        for (let i = 0; i < 12; i++)
          box(0.04, 0.06, 0.012, px, 0.4 + i * 0.32, pz + 0.06, dark, parent);
      }
    for (const y of [0.3, 2.15, 4.0]) {
      for (const pz of [z - 0.65, z + 0.65])
        box(width, 0.12, 0.1, x, y, pz, orange, parent);
      box(width, 0.04, 1.2, x, y + 0.08, z, dark, parent);
    }
    for (const sign of [-1, 1])
      line(
        [
          [x - width / 2, 0.3, z + sign * 0.65],
          [x - width / 2, 2.15, z - sign * 0.65],
          [x - width / 2, 4, z + sign * 0.65],
        ],
        parent,
      );
  };

  let duration = 18;
  if (id === "services-air" || id === "home-air") {
    buildWidebody(id === "home-air");
  } else if (id === "industries-food") {
    // A distinct high-wing regional turboprop, not a reskin of the widebody.
    const body = mesh(new T.SphereGeometry(1, 56, 28), paint);
    body.scale.set(4.6, 0.56, 0.59);
    body.position.y = 1.35;
    const curvedGlazing = (
      x0: number,
      x1: number,
      a0: number,
      a1: number,
      side: number,
    ) => {
      const vertices: number[] = [],
        indices: number[] = [],
        n = 18,
        m = 8;
      for (let i = 0; i <= n; i++)
        for (let j = 0; j <= m; j++) {
          const x = T.MathUtils.lerp(x0, x1, i / n),
            a = T.MathUtils.lerp(a0, a1, j / m),
            r = Math.sqrt(Math.max(0, 1 - (x / 4.6) ** 2));
          const y = 0.56 * r * Math.cos(a),
            z = side * 0.59 * r * Math.sin(a);
          const normal = new T.Vector3(
            x / 4.6 ** 2,
            y / 0.56 ** 2,
            z / 0.59 ** 2,
          ).normalize();
          vertices.push(
            x + normal.x * 0.003,
            1.35 + y + normal.y * 0.003,
            z + normal.z * 0.003,
          );
        }
      for (let i = 0; i < n; i++)
        for (let j = 0; j < m; j++) {
          const k = i * (m + 1) + j;
          indices.push(k, k + 1, k + m + 1, k + 1, k + m + 2, k + m + 1);
        }
      const g = new T.BufferGeometry();
      g.setAttribute("position", new T.Float32BufferAttribute(vertices, 3));
      g.setIndex(indices);
      g.computeVertexNormals();
      const pane = mesh(g, glass);
      pane.name = "turboprop-shell-glazing";
      pane.userData.glazingSurface = "ellipsoid";
    };
    glass.side = T.DoubleSide;
    for (const side of [-1, 1])
      for (let i = 0; i < 2; i++)
        curvedGlazing(3.12 + i * 0.43, 3.51 + i * 0.43, 0.3, 1.16, side);
    for (const sign of [-1, 1]) {
      const vertices: number[] = [],
        indices: number[] = [],
        n = 18,
        m = 18;
      for (let face = 0; face < 2; face++)
        for (let i = 0; i <= n; i++)
          for (let j = 0; j <= m; j++) {
            const s = i / n,
              c = j / m,
              chord = 2.05 - s * 0.94;
            const thickness =
              5 *
              0.085 *
              (0.2969 * Math.sqrt(c) -
                0.126 * c -
                0.3516 * c * c +
                0.2843 * c * c * c -
                0.1015 * c * c * c * c) *
              chord;
            vertices.push(
              0.5 - s * 0.65 - c * chord,
              2.02 + s * 0.17 + (face === 0 ? thickness : -thickness),
              sign * (0.3 + s * 5.45),
            );
          }
      const stride = (n + 1) * (m + 1);
      for (let face = 0; face < 2; face++)
        for (let i = 0; i < n; i++)
          for (let j = 0; j < m; j++) {
            const k = face * stride + i * (m + 1) + j;
            if ((face === 0) === (sign === 1))
              indices.push(k, k + m + 1, k + 1, k + 1, k + m + 1, k + m + 2);
            else indices.push(k, k + 1, k + m + 1, k + 1, k + m + 2, k + m + 1);
          }
      const g = new T.BufferGeometry();
      g.setAttribute("position", new T.Float32BufferAttribute(vertices, 3));
      g.setIndex(indices);
      g.computeVertexNormals();
      mesh(g, paint);
      const tail = new T.Shape();
      tail.moveTo(-2.9, 0.3 * sign);
      tail.lineTo(-3.6, 2.3 * sign);
      tail.lineTo(-4.4, 2.3 * sign);
      tail.lineTo(-4.35, 0.3 * sign);
      tail.closePath();
      const tg = new T.ExtrudeGeometry(tail, {
        depth: 0.07,
        bevelEnabled: false,
      });
      tg.rotateX(Math.PI / 2);
      mesh(tg, paint).position.y = 1.75;
      line(
        Array.from({ length: 20 }, (_, i) => {
          const s = i / 19;
          return [
            0.5 - s * 0.65 - (2.05 - s * 0.94) * 0.8,
            2.06 + s * 0.17,
            sign * (0.3 + s * 5.45),
          ];
        }),
      );
    }
    const fin = new T.Shape();
    fin.moveTo(-4.3, 1.65);
    fin.lineTo(-4.1, 3.8);
    fin.lineTo(-3.7, 3.8);
    fin.lineTo(-2.6, 1.65);
    fin.closePath();
    const finG = new T.ExtrudeGeometry(fin, {
      depth: 0.1,
      bevelEnabled: true,
      bevelSize: 0.025,
      bevelThickness: 0.025,
      bevelSegments: 2,
      steps: 1,
    });
    finG.translate(0, 0, -0.05);
    mesh(finG, orange);
    const propellers: T.Group[] = [];
    for (const z of [-2.6, 2.6]) {
      const g = mesh(new T.SphereGeometry(1, 32, 16), dark);
      g.scale.set(1.28, 0.38, 0.38);
      g.position.set(0.2, 1.6, z);
      const prop = new T.Group();
      prop.position.set(1.3, 1.6, z);
      moving.add(prop);
      propellers.push(prop);
      const hub = mesh(new T.ConeGeometry(0.18, 0.42, 24), metal, prop);
      hub.rotation.z = -Math.PI / 2;
      hub.position.x = 0.16;
      for (let b = 0; b < 6; b++) {
        const blade = box(0.055, 1.92, 0.12, 0, 0, 0, dark, prop);
        blade.rotation.x = (b * Math.PI) / 3;
      }
      wheel(-0.8, 0.3, z * 0.45, 0.3);
      box(0.06, 0.7, 0.06, -0.8, 0.7, z * 0.45, metal);
    }
    wheel(3.1, 0.23, 0, 0.23);
    box(0.07, 0.7, 0.07, 3.1, 0.65, 0, metal);
    for (let i = 0; i < 7; i++)
      for (const side of [-1, 1])
        curvedGlazing(-2.51 + i * 0.57, -2.29 + i * 0.57, 1.0, 1.3, side);
    const cargo = pallet(moving, true);
    cargo.position.set(-2.5, 0.35, 2.4);
    const trolley = box(2.1, 0.18, 1.65, -2.5, 0.32, 2.4, metal);
    const cold = new T.Group();
    moving.add(cold);
    box(0.18, 1.1, 0.12, -3.7, 0.75, 2.4, orange, cold);
    const ring = mesh(new T.TorusGeometry(0.34, 0.025, 8, 40), orange, cold);
    ring.position.set(-3.7, 1.5, 2.4);
    ticks.push((t) => {
      propellers.forEach((p) => (p.rotation.x = t * 7));
      const travel = pulse(t, 2, 6, 11, 16) * 0.9;
      cargo.position.x = -2.5 + travel;
      trolley.position.x = -2.5 + travel;
      ring.scale.setScalar(1 + 0.035 * Math.sin(t * 2));
    });
  } else if (id === "services-port" || id === "home-port") {
    duration = 24;
    const shape = new T.Shape();
    shape.moveTo(-6.4, -1.45);
    shape.lineTo(4.8, -1.45);
    shape.quadraticCurveTo(7, -0.8, 7.4, 0);
    shape.quadraticCurveTo(7, 0.8, 4.8, 1.45);
    shape.lineTo(-6.4, 1.45);
    shape.quadraticCurveTo(-7.1, 0, -6.4, -1.45);
    const g = new T.ExtrudeGeometry(shape, {
      depth: 1.3,
      bevelEnabled: true,
      bevelSize: 0.1,
      bevelThickness: 0.1,
      bevelSegments: 3,
      steps: 1,
    });
    g.rotateX(-Math.PI / 2);
    mesh(g, dark).position.y = 0.2;
    box(11.6, 0.1, 2.8, -0.3, 1.55, 0, paint);
    for (let x = 0; x < 6; x++)
      for (let z = 0; z < 3; z++)
        for (let y = 0; y < (x === 4 && z === 2 ? 1 : 2); y++)
          container(
            -3.65 + x * 1.4,
            1.99 + y * 0.79,
            -0.93 + z * 0.94,
            moving,
            (x + z) % 3 === 0,
          );
    box(1.4, 1.5, 2.4, -5.4, 2.3, 0);
    box(1.7, 0.55, 2.6, -5.4, 3.3, 0);
    for (let i = 0; i < 7; i++)
      box(0.02, 0.2, 0.27, -4.53, 3.36, -0.99 + i * 0.33, glass);
    box(0.55, 1, 0.65, -5.5, 4, 0, orange);
    cyl(0.025, 1.5, -5.2, 4.8, 0);
    const radar = box(1.1, 0.05, 0.08, -5.2, 5.5, 0, metal);
    if (id === "home-port") {
      const wake = new T.Group();
      moving.add(wake);
      for (let i = 0; i < 5; i++)
        for (const sign of [-1, 1])
          line(
            [
              [-6, 0.12, sign * (1.3 + i * 0.1)],
              [-8 - i * 0.2, 0.12, sign * (2 + i * 0.2)],
            ],
            wake,
          );
      const prop = mesh(new T.TorusGeometry(0.3, 0.045, 8, 24), metal);
      prop.rotation.y = Math.PI / 2;
      prop.position.set(-6.65, 0.25, 0);
      ticks.push((t) => {
        moving.rotation.x = Math.sin(t * 0.65) * 0.012;
        moving.rotation.z = Math.sin(t * 0.8) * 0.006;
        moving.position.y = Math.sin(t * 0.7) * 0.045;
        wake.position.x = -((t * 0.4) % 1.2);
        radar.rotation.y = t * 0.6;
        prop.rotation.x = t * 3;
      });
    } else {
      // Quay crane and its actual suspended spreader; no decorative particle spray.
      const crane = new T.Group();
      crane.position.set(2, 0, -4.3);
      moving.add(crane);
      for (const x of [-1, 1])
        for (const z of [-0.7, 0.7])
          box(0.18, 6.3, 0.18, x, 3.15, z, metal, crane);
      box(2.5, 0.3, 7.2, 0, 6.25, 1.8, orange, crane);
      for (const x of [-1, 1])
        line(
          [
            [x, 1, -0.7],
            [x, 4, 0.7],
            [x, 6.2, -0.7],
          ],
          crane,
        );
      const trolley = new T.Group();
      crane.add(trolley);
      box(1.1, 0.17, 0.75, 0, 6.4, 0, dark, trolley);
      const load = new T.Group();
      trolley.add(load);
      container(0, 0, 0, load, true);
      box(1.42, 0.07, 0.98, 0, 0.49, 0, metal, load);
      const cables = [-0.48, 0.48].map((x) =>
        cyl(0.012, 1, x, 5, 0, metal, trolley),
      );
      ticks.push((t) => {
        const traverse = pulse(t, 3, 9, 19, 24) * 5.23;
        const hoist = pulse(t, 0.1, 2.8, 21, 24) * 1.2;
        const down = pulse(t, 12, 18, 19, 23) * 2.12;
        trolley.position.z = traverse;
        load.position.y = 3.7 + hoist - down;
        cables.forEach((c) => {
          const length = 6.3 - load.position.y - 0.49;
          c.scale.y = length;
          c.position.y = 6.3 - length / 2;
        });
        radar.rotation.y = t * 0.6;
      });
    }
  } else if (
    id === "services-road" ||
    id === "industries-industrial" ||
    id === "home-road"
  ) {
    const project = id === "industries-industrial";
    const tractor = new T.Group();
    moving.add(tractor);
    box(10.4, 0.3, 1.9, -0.1, 0.9, 0, dark, tractor);
    box(2.1, 2, 2.2, 3.95, 2.08, 0, paint, tractor, 0.15);
    box(2.15, 0.65, 2.12, 3.9, 3.2, 0, paint, tractor, 0.12);
    const cabPane = (w: number, h: number) => {
      const s = new T.Shape(),
        r = 0.055,
        x = -w / 2,
        y = -h / 2;
      s.moveTo(x + r, y);
      s.lineTo(x + w - r, y);
      s.quadraticCurveTo(x + w, y, x + w, y + r);
      s.lineTo(x + w, y + h - r);
      s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      s.lineTo(x + r, y + h);
      s.quadraticCurveTo(x, y + h, x, y + h - r);
      s.lineTo(x, y + r);
      s.quadraticCurveTo(x, y, x + r, y);
      return mesh(new T.ShapeGeometry(s, 8), glass, tractor);
    };
    for (const sign of [-1, 1]) {
      const pane = cabPane(0.82, 0.6);
      pane.rotation.y = Math.PI / 2;
      pane.position.set(5.003, 2.57, sign * 0.45);
      pane.name = "cab-front-glazing";
      pane.userData.glazingSurface = "cab-front";
    }
    for (const sign of [-1, 1]) {
      const pane = cabPane(1.34, 0.6);
      pane.rotation.y = sign === 1 ? 0 : Math.PI;
      pane.position.set(3.93, 2.57, sign * 1.103);
      pane.name = "cab-side-glazing";
      pane.userData.glazingSurface = "cab-side";
      box(0.45, 0.12, 0.1, 4.1, 1.83, sign * 1.14, metal, tractor);
      box(0.08, 0.5, 0.25, 4.82, 2.66, sign * 1.32, dark, tractor);
      box(0.52, 0.12, 0.09, 4.6, 1.35, sign * 0.78, glow, tractor);
      for (const y of [1.1, 1.3])
        box(1, 0.05, 0.18, 3.8, y, sign * 1.17, metal, tractor);
    }
    for (let i = 0; i < 7; i++)
      box(0.04, 0.43, 0.09, 5.03, 1.85, -0.57 + i * 0.19, dark, tractor);
    box(0.13, 0.24, 2.28, 5.05, 1.12, 0, metal, tractor);
    const wheels: T.Group[] = [];
    for (const x of [-4.2, -3.15, 1.5, 4.1])
      for (const z of [-1.04, 1.04])
        wheels.push(wheel(x, 0.55, z, 0.55, tractor));
    if (id === "home-road") {
      box(7.2, 2.5, 2.2, -1.6, 2.5, 0, orange);
      for (let i = 0; i < 28; i++)
        for (const sign of [-1, 1])
          box(0.035, 2.35, 0.03, -5 + i * 0.25, 2.5, sign * 1.115, orange);
      for (const sign of [-1, 1]) {
        box(7.1, 0.07, 0.08, -1.6, 1.18, sign * 1.2, metal);
        for (let i = 0; i < 5; i++)
          box(0.22, 0.07, 0.03, -4.8 + i * 1.5, 1.2, sign * 1.25, glow);
      }
      const marks = new T.Group();
      moving.add(marks);
      for (let i = 0; i < 9; i++)
        box(0.7, 0.012, 0.04, -5 + i * 1.3, 0.01, 1.9, paint, marks);
      ticks.push((t) => {
        wheels.forEach((w) => (w.rotation.z = -t * 2.8));
        tractor.position.y = Math.sin(t * 6) * 0.018;
        marks.position.x = -((t * 1.7) % 1.3);
      });
    } else if (!project) {
      // Open rear aperture, hinged doors and an articulated tail lift.
      box(7.2, 0.12, 2.2, -1.6, 1.25, 0, metal);
      box(7.2, 0.1, 2.2, -1.6, 3.7, 0, orange);
      for (const z of [-1.1, 1.1]) {
        box(7.2, 2.4, 0.07, -1.6, 2.48, z, orange);
        for (let i = 0; i < 27; i++)
          box(0.04, 2.24, 0.035, -5.05 + i * 0.26, 2.48, z * 1.04, orange);
      }
      const doors: T.Group[] = [];
      for (const sign of [-1, 1]) {
        const d = new T.Group();
        d.position.set(-5.24, 2.48, sign * 1.1);
        moving.add(d);
        box(0.1, 2.4, 1.08, 0, 0, -sign * 0.54, paint, d);
        cyl(0.025, 2.1, -0.07, 0, -sign * 0.6, metal, d);
        doors.push(d);
      }
      const platform = box(1.9, 0.12, 2.1, -6.2, 1.25, 0, metal);
      const cargo = pallet();
      cargo.position.set(-4.1, 1.33, 0);
      ticks.push((t) => {
        const open = pulse(t, 0, 3, 15, 18);
        doors.forEach(
          (d, i) => (d.rotation.y = (i === 0 ? -1 : 1) * open * 1.45),
        );
        const transfer = pulse(t, 3, 7, 13, 16);
        const lower = pulse(t, 7, 10, 11, 13) * 0.93;
        cargo.position.x = -4.1 - transfer * 2.15;
        cargo.position.y = 1.33 - lower;
        platform.position.y = 1.25 - lower;
      });
    } else {
      box(7.6, 0.22, 2.5, -1.6, 1.03, 0, metal);
      for (let i = 0; i < 12; i++)
        box(0.45, 0.025, 2.3, -5 + i * 0.59, 1.17, 0, wood);
      const turbine = new T.Group();
      turbine.position.set(-1.65, 1.38, 0);
      moving.add(turbine);
      cyl(0.88, 3.2, 0, 0.85, 0, paint, turbine, "x");
      for (const x of [-1.62, 1.62]) {
        cyl(0.96, 0.09, x, 0.85, 0, metal, turbine, "x");
        for (let i = 0; i < 16; i++) {
          const a = (i / 16) * Math.PI * 2;
          cyl(
            0.045,
            0.14,
            x,
            0.85 + Math.sin(a) * 0.82,
            Math.cos(a) * 0.82,
            dark,
            turbine,
            "x",
          );
        }
      }
      for (const x of [-1.1, 1.1]) {
        box(0.3, 0.25, 2, x, 0.12, 0, orange, turbine);
        line(
          [
            [x, 0.1, -1.12],
            [x, 1.75, -0.5],
            [x, 1.75, 0.5],
            [x, 0.1, 1.12],
          ],
          turbine,
        );
      }
      const crane = new T.Group();
      crane.position.set(-1.65, 0, -3.7);
      moving.add(crane);
      box(2, 0.3, 2, 0, 0.2, 0, dark, crane);
      cyl(0.3, 5.8, 0, 3.1, 0, metal, crane);
      const boom = new T.Group();
      boom.position.y = 5.8;
      crane.add(boom);
      box(0.23, 0.25, 5.4, 0, 0, 1.8, orange, boom);
      const cable = cyl(0.017, 3, 0, -1.6, 4.2, metal, boom);
      const hook = mesh(new T.TorusGeometry(0.09, 0.025, 8, 20), metal);
      const slings = [-1, 1].map(() =>
        line(
          [
            [0, 0, 0],
            [0, 0, 0],
            [0, 0, 0],
          ],
          moving,
          new T.LineBasicMaterial({
            color: "#91a6a2",
            transparent: true,
            opacity: 0.8,
          }),
        ),
      );
      ticks.push((t) => {
        const lift = pulse(t, 1, 5, 10, 16) * 1.05;
        turbine.position.y = 1.38 + lift;
        boom.rotation.y = -0.12 * pulse(t, 1, 4, 13, 17);
        const length = 1.8 - lift;
        cable.scale.y = length / 3;
        cable.position.y = -0.1 - length / 2;
        const hookX = crane.position.x + Math.sin(boom.rotation.y) * 4.2,
          hookZ = crane.position.z + Math.cos(boom.rotation.y) * 4.2;
        hook.position.set(hookX, 3.9 + lift, hookZ);
        turbine.position.x = hookX;
        turbine.position.z = hookZ - 0.5;
        slings.forEach((s, i) => {
          const sign = i === 0 ? -1 : 1;
          s.geometry.setFromPoints([
            new T.Vector3(
              hookX - 1.1,
              2.98 + lift,
              turbine.position.z + sign * 0.45,
            ),
            hook.position,
            new T.Vector3(
              hookX + 1.1,
              2.98 + lift,
              turbine.position.z + sign * 0.45,
            ),
          ]);
        });
      });
    }
  } else if (id.includes("warehouse")) {
    const reach = id === "services-warehouse",
      dispatch = id === "industries-warehouse",
      auto = id === "about-warehouse";
    if (auto) {
      rack(-1.8, -1.8, moving, 3.3);
      rack(1.8, -1.8, moving, 3.3);
      for (const x of [-2.6, -0.9, 0.9, 2.6]) {
        const p = pallet();
        p.scale.setScalar(0.8);
        p.position.set(x, 2.28, -1.8);
      }
      for (const z of [0.2, 1.8]) box(8.5, 0.08, 0.08, 0, 0.2, z, metal);
      const shuttle = new T.Group();
      moving.add(shuttle);
      box(1.9, 0.35, 1.8, 0, 0.38, 1, dark, shuttle);
      box(1.85, 0.08, 1.74, 0, 0.6, 1, orange, shuttle);
      const cargo = pallet(shuttle);
      cargo.position.set(0, 0.66, 1);
      const transfer = box(1.7, 0.045, 2.6, 0, 0.64, 0.4, metal, shuttle);
      for (const x of [-0.8, 0.8])
        for (const z of [0.3, 1.7]) wheel(x, 0.22, z, 0.19, shuttle);
      ticks.push((t) => {
        shuttle.position.x = -2.6 + pulse(t, 1, 5, 12, 17) * 5.2;
        const slide = pulse(t, 6, 9, 10, 12) * 1.1;
        cargo.position.z = 1 - slide;
        transfer.position.z = 0.4 - slide * 0.5;
      });
    } else {
      const vehicle = new T.Group();
      moving.add(vehicle);
      box(
        reach || dispatch ? 1.5 : 2.3,
        0.75,
        1.55,
        -0.65,
        0.8,
        0,
        orange,
        vehicle,
        0.13,
      );
      if (!dispatch) {
        box(0.55, 0.28, 0.65, -0.6, 1.42, 0, rubber, vehicle);
        box(0.18, 0.65, 0.65, -0.9, 1.7, 0, rubber, vehicle);
        for (const x of [-1.25, 0.4])
          for (const z of [-0.71, 0.71])
            box(0.07, 1.9, 0.07, x, 2, z, metal, vehicle);
        box(1.85, 0.1, 1.65, -0.42, 3, 0, dark, vehicle);
        const steering = mesh(
          new T.TorusGeometry(0.18, 0.025, 8, 24),
          rubber,
          vehicle,
        );
        steering.position.set(0.1, 1.75, 0);
        steering.rotation.y = Math.PI / 2;
      } else {
        box(0.1, 1.7, 0.1, -1.2, 1.5, 0, metal, vehicle);
        box(0.15, 0.07, 0.9, -1.2, 2.3, 0, dark, vehicle);
      }
      for (const z of [-0.62, 0.62]) {
        box(
          0.11,
          reach ? 4.3 : 3.3,
          0.14,
          0.65,
          reach ? 2.2 : 1.75,
          z,
          metal,
          vehicle,
        );
        cyl(0.04, 2, 0.7, 1.5, z, metal, vehicle);
        line(
          [
            [0.68, 0.5, z + 0.1],
            [0.68, 3, z + 0.1],
          ],
          vehicle,
        );
      }
      const carriage = new T.Group();
      vehicle.add(carriage);
      carriage.position.set(0.75, 0.45, 0);
      box(0.12, 0.5, 1.45, 0, 0.2, 0, dark, carriage);
      for (const z of [-0.52, 0.52])
        box(1.8, 0.075, 0.18, 0.85, 0, z, metal, carriage);
      const cargo = pallet(carriage);
      cargo.position.set(0.95, 0.09, 0);
      const wheels: T.Group[] = [];
      for (const x of [-1.2, 0.35])
        for (const z of [-0.82, 0.82])
          wheels.push(wheel(x, 0.36, z, 0.36, vehicle));
      // Visible hose follows the carriage instead of a floating unsupported load.
      const hose = cyl(0.025, 1, 0.58, 1.2, 0.72, rubber, vehicle);
      if (reach) rack(3.35, 0, moving, 2.3);
      if (dispatch) {
        box(3.3, 0.2, 1.8, 3.3, 0.6, 0, metal);
        for (let i = 0; i < 10; i++)
          cyl(0.09, 1.7, 1.9 + i * 0.3, 0.76, 0, metal, moving, "z");
      }
      ticks.push((t) => {
        const lift =
          pulse(t, reach ? 1 : 0, reach ? 5 : 3, 12, 17) *
          (reach ? 1.85 : dispatch ? 0.32 : 0.95);
        carriage.position.y = 0.45 + lift;
        carriage.position.x = 0.75 + (reach ? pulse(t, 6, 9, 10, 12) * 0.9 : 0);
        const travel = reach
          ? 0
          : pulse(t, 3, 7, 11, 15) * (dispatch ? 0.7 : 0.8);
        vehicle.position.x = travel;
        wheels.forEach((w) => (w.rotation.z = -travel / 0.36));
        hose.scale.y = 0.8 + lift;
        hose.position.y = 0.7 + lift * 0.5;
      });
    }
  } else {
    // Three entirely different cargo applications, with purposeful mechanical action.
    const inspection = id === "home-electronics",
      packing = id === "industries-electronics";
    if (inspection) {
      box(6, 0.25, 2.4, 0, 0.55, 0, dark);
      for (let i = 0; i < 17; i++)
        cyl(0.12, 2.2, -2.72 + i * 0.34, 0.75, 0, metal, moving, "z");
      const cargo = pallet();
      cargo.position.y = 0.9;
      for (const z of [-1.22, 1.22]) box(0.14, 3, 0.14, 0.1, 1.8, z, paint);
      box(0.3, 0.15, 2.6, 0.1, 3.3, 0, orange);
      const scanner = box(
        0.025,
        1.9,
        2,
        0.1,
        1.96,
        0,
        new T.MeshBasicMaterial({
          color: "#f5874b",
          transparent: true,
          opacity: 0.07,
          depthWrite: false,
        }),
      );
      const light = box(0.08, 0.09, 0.18, 0.29, 3.3, 0.9, glow);
      ticks.push((t) => {
        cargo.position.x = -2.2 + smooth(0, 16, t) * 4.4;
        scanner.visible = t > 5 && t < 12;
        light.scale.y = 1 + Math.sin(t * 3) * 0.25;
      });
    } else if (packing) {
      box(4.4, 0.22, 3.2, 0, 0.25, 0, metal);
      const base = box(4, 0.4, 2.8, 0, 0.54, 0, dark);
      for (const z of [-1.48, 1.48]) box(4.3, 0.6, 0.14, 0, 0.62, z, paint);
      for (const x of [-2.08, 2.08]) box(0.14, 0.6, 2.8, x, 0.62, 0, paint);
      const devices: T.Mesh[] = [];
      for (let x = 0; x < 5; x++)
        for (let z = 0; z < 2; z++) {
          const px = -1.55 + x * 0.77,
            pz = -0.65 + z * 1.3;
          box(0.68, 0.09, 1.15, px, 0.8, pz, rubber);
          const device = box(0.53, 0.07, 0.99, px, 0.91, pz, metal);
          box(0.43, 0.012, 0.8, 0, 0.04, 0, glass, device);
          devices.push(device);
        }
      const lid = box(4.3, 0.18, 3.1, 0, 2.5, 0, paint);
      box(3.92, 0.12, 2.72, 0, -0.13, 0, rubber, lid);
      const straps = [-1.4, 1.4].map((x) =>
        box(0.045, 0.8, 3.13, x, 0.66, 0, orange),
      );
      ticks.push((t) => {
        devices.forEach(
          (d, i) =>
            (d.position.y =
              0.91 + (1 - smooth(0.3 + i * 0.3, 2 + i * 0.3, t)) * 0.8),
        );
        lid.position.y = 2.5 - pulse(t, 5, 9, 13, 17) * 1.48;
        straps.forEach((s) => (s.scale.y = smooth(9, 12, t)));
        base.position.y = 0.54;
      });
    } else {
      box(3.9, 1.5, 2.65, 0, 1.05, 0, dark, moving, 0.12);
      for (const x of [-1.86, 1.86])
        for (const z of [-1.2, 1.2]) box(0.16, 1.55, 0.16, x, 1.05, z, metal);
      for (const y of [0.3, 1.77]) box(4, 0.1, 2.72, 0, y, 0, metal);
      const lid = new T.Group();
      lid.position.set(0, 1.83, -1.34);
      moving.add(lid);
      box(4, 0.2, 2.68, 0, 0.02, 1.34, paint, lid);
      for (const x of [-1.3, 1.3]) {
        box(0.3, 0.25, 0.08, x, 1.7, 1.38, metal);
        box(0.13, 0.06, 0.02, x, 1.7, 1.44, orange);
      }
      const insert = box(3.6, 0.13, 2.3, 0, 1.72, 0, rubber);
      const cargo = box(2.2, 0.42, 1.3, 0, 1.84, 0, metal);
      box(1.8, 0.025, 1, 0, 0.23, 0, dark, cargo);
      const scanner = new T.Group();
      moving.add(scanner);
      box(0.3, 0.12, 0.55, 2.5, 2.45, 0, orange, scanner);
      box(0.09, 0.5, 0.12, 2.5, 2.17, 0.1, dark, scanner);
      ticks.push((t) => {
        const open = pulse(t, 1, 5, 13, 17);
        lid.rotation.x = -open * 1.68;
        insert.position.y = 1.72;
        cargo.position.y = 1.84 + pulse(t, 5, 8, 10, 13) * 0.35;
        scanner.position.z = Math.sin(t * 0.4) * 0.65;
      });
    }
  }

  function container(
    x: number,
    y: number,
    z: number,
    parent: T.Object3D,
    accent: boolean,
  ) {
    box(1.32, 0.74, 0.9, x, y, z, accent ? orange : paint, parent);
    const ribs = new T.InstancedMesh(
      new T.BoxGeometry(0.023, 0.66, 0.018),
      accent ? orange : paint,
      14,
    );
    for (let i = 0; i < 7; i++)
      for (let side = 0; side < 2; side++)
        ribs.setMatrixAt(
          i * 2 + side,
          new T.Matrix4().makeTranslation(
            x - 0.55 + i * 0.18,
            y,
            z + (side === 0 ? -1 : 1) * 0.46,
          ),
        );
    parent.add(ribs);
    for (const sign of [-1, 1])
      cyl(0.012, 0.6, x + 0.67, y, z + sign * 0.27, metal, parent);
  }

  function buildWidebody(flight: boolean) {
    // Smooth longitudinal profile, profiled swept wings, recessed intakes and a curved hinged cargo door.
    const points = [
      [-6.6, 0.025],
      [-6.1, 0.2],
      [-5.2, 0.52],
      [-4, 0.745],
      [-2, 0.78],
      [1, 0.78],
      [3.8, 0.76],
      [4.6, 0.68],
      [5.25, 0.51],
      [5.9, 0.25],
      [6.25, 0.025],
    ];
    const profile = new T.CatmullRomCurve3(
      points.map(([x, r]) => new T.Vector3(x, r, 0)),
    ).getPoints(240);
    const radius = (x: number) => {
      const i = Math.max(
        1,
        profile.findIndex((p) => p.x >= x),
      );
      const a = profile[i - 1],
        b = profile[i];
      return T.MathUtils.lerp(
        a.y,
        b.y,
        T.MathUtils.clamp((x - a.x) / Math.max(0.0001, b.x - a.x), 0, 1),
      );
    };
    const hullPoint = (x: number, a: number, off = 0) => {
      const r = radius(x) + off;
      return new T.Vector3(x, 1.65 + Math.cos(a) * r * 0.91, Math.sin(a) * r);
    };
    const surface = (xs: number[], angles: number[], cut = false, off = 0) => {
      const v: number[] = [],
        indices: number[] = [];
      for (const x of xs)
        for (const a of angles) v.push(...hullPoint(x, a, off).toArray());
      for (let i = 0; i < xs.length - 1; i++)
        for (let j = 0; j < angles.length - 1; j++) {
          const x = (xs[i] + xs[i + 1]) / 2,
            a = (angles[j] + angles[j + 1]) / 2;
          if (cut && x > -4 && x < -2.15 && a > 0.78 && a < 2.2) continue;
          const k = i * angles.length + j;
          indices.push(
            k,
            k + 1,
            k + angles.length,
            k + 1,
            k + angles.length + 1,
            k + angles.length,
          );
        }
      const g = new T.BufferGeometry();
      g.setAttribute("position", new T.Float32BufferAttribute(v, 3));
      g.setIndex(indices);
      g.computeVertexNormals();
      return g;
    };
    const xs = [
        ...new Set([
          ...Array.from({ length: 101 }, (_, i) => -6.6 + (i * 12.85) / 100),
          -4,
          -2.15,
        ]),
      ].sort((a, b) => a - b),
      angles = [
        ...new Set([
          ...Array.from({ length: 97 }, (_, i) => (i / 96) * Math.PI * 2),
          0.78,
          2.2,
        ]),
      ].sort((a, b) => a - b);
    paint.side = T.DoubleSide;
    mesh(surface(xs, angles, true), paint);
    for (const side of [-1, 1])
      for (let pane = 0; pane < 3; pane++)
        mesh(
          surface(
            Array.from({ length: 10 }, (_, i) => 4.72 + (i * 0.85) / 9),
            Array.from(
              { length: 5 },
              (_, j) => side * (0.12 + pane * 0.31 + (j * 0.275) / 4),
            ),
            false,
            0.004,
          ),
          glass,
        );
    for (const x of [-5, -4.5, -1.8, -0.5, 1, 2.5, 4])
      line(
        Array.from({ length: 73 }, (_, i) =>
          hullPoint(x, (i / 72) * Math.PI * 2, 0.008).toArray(),
        ),
      );
    const wing = (sign: number, tail = false) => {
      const v: number[] = [],
        ids: number[] = [],
        n = 20,
        m = 20,
        span = tail ? 3.15 : 7.65;
      for (let face = 0; face < 2; face++)
        for (let i = 0; i <= n; i++)
          for (let j = 0; j <= m; j++) {
            const s = i / n,
              c = j / m,
              lead = tail ? -3.95 - s * 1.2 : 1.55 - s * 3.05,
              chord = tail ? 2.15 - s * 1.2 : 4.2 - s * 3.08,
              thickness =
                5 *
                0.055 *
                (0.2969 * Math.sqrt(c) -
                  0.126 * c -
                  0.3516 * c * c +
                  0.2843 * c * c * c -
                  0.1015 * c * c * c * c) *
                chord;
            v.push(
              lead - c * chord,
              (tail ? 1.72 : 1.34) +
                s * 0.37 +
                (face === 0 ? 1 : -1) * thickness,
              sign * (0.45 + s * span),
            );
          }
      const stride = (n + 1) * (m + 1);
      for (let face = 0; face < 2; face++)
        for (let i = 0; i < n; i++)
          for (let j = 0; j < m; j++) {
            const k = face * stride + i * (m + 1) + j;
            if ((face === 0) === (sign === 1))
              ids.push(k, k + m + 1, k + 1, k + 1, k + m + 1, k + m + 2);
            else ids.push(k, k + 1, k + m + 1, k + 1, k + m + 2, k + m + 1);
          }
      const g = new T.BufferGeometry();
      g.setAttribute("position", new T.Float32BufferAttribute(v, 3));
      g.setIndex(ids);
      g.computeVertexNormals();
      mesh(g, paint);
    };
    const fans: T.Group[] = [];
    for (const sign of [-1, 1]) {
      wing(sign);
      wing(sign, true);
      const e = new T.Group();
      e.position.set(0.28, 0.67, sign * 3.1);
      moving.add(e);
      const ng = new T.LatheGeometry(
        [
          [-1.05, 0.31],
          [-0.82, 0.37],
          [0.22, 0.53],
          [0.73, 0.52],
          [0.94, 0.49],
        ].map(([x, r]) => new T.Vector2(r, x)),
        48,
      );
      ng.rotateZ(-Math.PI / 2);
      mesh(ng, paint, e);
      const lip = mesh(new T.TorusGeometry(0.49, 0.045, 10, 48), metal, e);
      lip.rotation.y = Math.PI / 2;
      lip.position.x = 0.93;
      const tube = mesh(
        new T.CylinderGeometry(0.447, 0.39, 0.65, 40, 1, true),
        dark,
        e,
      );
      tube.rotation.z = Math.PI / 2;
      tube.position.x = 0.56;
      cyl(0.4, 0.035, 0.25, 0, 0, dark, e, "x");
      const fan = new T.Group();
      fan.position.x = 0.3;
      e.add(fan);
      fans.push(fan);
      const bladeGeometry = new T.BufferGeometry();
      bladeGeometry.setAttribute(
        "position",
        new T.Float32BufferAttribute(
          [
            0.015, 0.1, 0, -0.035, 0.402, 0.048, 0.025, 0.39, 0.108, 0.055,
            0.093, 0.037,
          ],
          3,
        ),
      );
      bladeGeometry.setIndex([0, 1, 2, 0, 2, 3]);
      bladeGeometry.computeVertexNormals();
      const blades = new T.InstancedMesh(bladeGeometry, metal, 22);
      for (let i = 0; i < 22; i++)
        blades.setMatrixAt(
          i,
          new T.Matrix4().makeRotationX((i / 22) * Math.PI * 2),
        );
      fan.add(blades);
      const cone = mesh(new T.ConeGeometry(0.115, 0.3, 24), metal, e);
      cone.rotation.z = -Math.PI / 2;
      cone.position.x = 0.47;
      box(0.72, 0.78, 0.13, -0.25, 1.05, sign * 3.1, metal);
    }
    const fin = new T.Shape();
    fin.moveTo(-6.15, 1.65);
    fin.lineTo(-5.66, 4.45);
    fin.lineTo(-5.13, 4.45);
    fin.lineTo(-3.5, 1.65);
    fin.closePath();
    const fg = new T.ExtrudeGeometry(fin, {
      depth: 0.13,
      bevelEnabled: true,
      bevelSize: 0.025,
      bevelThickness: 0.025,
      bevelSegments: 2,
      steps: 1,
    });
    fg.translate(0, 0, -0.065);
    mesh(fg, orange);
    const landingGear = new T.Group();
    moving.add(landingGear);
    for (const [x, z] of [
      [4.25, 0],
      [-1.3, -1.1],
      [-1.3, 1.1],
    ]) {
      box(0.065, 0.72, 0.065, x, 0.65, z, metal, landingGear);
      for (const sign of [-1, 1])
        wheel(x, 0.25, z + sign * 0.18, 0.24, landingGear);
    }
    const hinge = hullPoint(-3.075, 0.78, 0.014),
      door = new T.Group();
    door.position.copy(hinge);
    moving.add(door);
    const dg = surface(
      Array.from({ length: 25 }, (_, i) => -4 + (i * 1.85) / 24),
      Array.from({ length: 17 }, (_, i) => 0.78 + (i * 1.42) / 16),
    );
    dg.translate(-hinge.x, -hinge.y, -hinge.z);
    mesh(dg, paint, door);
    box(2.9, 0.06, 1.3, -3.08, 1.22, 0, dark);
    box(2.8, 0.8, 0.04, -3.08, 1.64, -0.58, dark);
    if (flight) {
      const marks = new T.Group();
      root.add(marks);
      for (let i = 0; i < 8; i++)
        box(0.8, 0.012, 0.07, -6 + i * 1.6, 0.005, 4.5, paint, marks);
      ticks.push((t) => {
        const climb = pulse(t, 2, 6, 11, 17);
        moving.position.y = climb * 0.6;
        moving.rotation.z = climb * 0.045;
        landingGear.position.y = climb * 0.75;
        landingGear.scale.y = 1 - climb * 0.65;
        door.rotation.x = 0;
        fans.forEach((f) => (f.rotation.x = t * 7));
        marks.position.x = -((t * 2) % 1.6);
      });
    } else {
      const loader = new T.Group();
      loader.position.set(-3.05, 0, 2.65);
      moving.add(loader);
      box(1.6, 0.2, 2.4, 0, 0.32, 0, dark, loader);
      for (const x of [-0.66, 0.66])
        for (const z of [-0.9, 0.9]) wheel(x, 0.22, z, 0.21, loader);
      const platform = new T.Group();
      loader.add(platform);
      box(1.55, 0.09, 2.1, 0, 0, 0, metal, platform);
      for (let i = 0; i < 9; i++)
        box(1.5, 0.025, 0.035, 0, 0.055, -0.9 + i * 0.225, paint, platform);
      const scissors: T.Mesh[] = [];
      for (const x of [-0.59, 0.59])
        for (const sign of [-1, 1]) {
          const b = box(0.055, 0.055, 1, x, 0.8, 0, metal, loader);
          b.userData.sign = sign;
          scissors.push(b);
        }
      const cargo = pallet();
      cargo.scale.setScalar(0.74);
      ticks.push((t) => {
        const p = t / 18,
          open = pulse(p, 0.06, 0.22, 0.77, 0.94),
          lift = smooth(0.18, 0.4, p),
          travel = smooth(0.42, 0.7, p);
        door.rotation.x = -open * 1.23;
        const y = 0.55 + lift * 0.64;
        platform.position.y = y;
        for (const b of scissors) {
          const h = y - 0.45;
          b.position.y = 0.45 + h * 0.5;
          b.scale.z = Math.sqrt(1.96 + h * h);
          b.rotation.x = b.userData.sign * Math.atan2(h, 1.4);
        }
        cargo.position.set(-3.05, y + 0.06, 2.65 - travel * 2.65);
        cargo.visible = p < 0.97;
        fans.forEach((f) => (f.rotation.x = t * 2.3));
      });
    }
  }

  // One registered technical layer per subject; restrained edges, no point-cloud noise.
  const technicalEdges: T.LineSegments[] = [];
  moving.traverse((o) => {
    if (o instanceof T.Mesh && !(o instanceof T.InstancedMesh)) {
      const edges = new T.LineSegments(
        new T.EdgesGeometry(o.geometry, 35),
        wire,
      );
      o.add(edges);
      edges.visible = false;
      technicalEdges.push(edges);
    }
  });
  const bounds = new T.Box3();
  for (let i = 0; i < 12; i++) {
    ticks.forEach((fn) => fn((i / 12) * duration));
    root.updateMatrixWorld(true);
    bounds.union(new T.Box3().setFromObject(root));
  }
  ticks.forEach((fn) => fn(0));
  root.updateMatrixWorld(true);
  const size = bounds.getSize(new T.Vector3()),
    centre = bounds.getCenter(new T.Vector3());
  const scale = 12 / Math.max(size.x, size.z);
  root.scale.setScalar(scale);
  root.position.set(
    -centre.x * scale,
    -bounds.min.y * scale,
    -centre.z * scale,
  );
  const rest = root.position.clone();
  root.updateMatrixWorld(true);
  const frameBounds = bounds.clone().applyMatrix4(root.matrixWorld);
  const scanUniforms = {
    uBodyScan: { value: bounds.min.x - 0.2 },
    uBodyInverse: { value: new T.Matrix4() },
    uBodyTech: { value: 0 },
  };
  const installScan = (mat: T.Material, isWire = false) => {
    mat.onBeforeCompile = (shader) => {
      Object.assign(shader.uniforms, scanUniforms);
      shader.vertexShader =
        "varying float vBodyX;uniform mat4 uBodyInverse;\n" +
        shader.vertexShader;
      shader.vertexShader = shader.vertexShader.replace(
        "#include <project_vertex>",
        "#include <project_vertex>\nvec4 bodyVertex=vec4(transformed,1.);\n#ifdef USE_INSTANCING\nbodyVertex=instanceMatrix*bodyVertex;\n#endif\nvBodyX=(uBodyInverse*modelMatrix*bodyVertex).x;",
      );
      shader.fragmentShader =
        "varying float vBodyX;uniform float uBodyScan,uBodyTech;\n" +
        shader.fragmentShader;
      const effect = isWire
        ? "gl_FragColor.a*=1.-smoothstep(uBodyScan-.12,uBodyScan+.12,vBodyX);"
        : "float scanned=1.-smoothstep(uBodyScan-.12,uBodyScan+.12,vBodyX);float edge=(1.-smoothstep(.025,.12,abs(vBodyX-uBodyScan)))*step(.01,uBodyTech)*step(uBodyTech,.99);gl_FragColor.a*=mix(1.,.12,scanned);gl_FragColor.rgb+=edge*vec3(.95,.22,.045)*.7;";
      shader.fragmentShader = shader.fragmentShader.replace(
        "#include <opaque_fragment>",
        "#include <opaque_fragment>\n" + effect,
      );
    };
  };
  for (const mat of materialSet) {
    mat.transparent = true;
    installScan(mat);
  }
  installScan(wire, true);
  return {
    root,
    moving,
    wire,
    parts: [] as {
      group: T.Group;
      home: T.Vector3;
      column: number;
      row: number;
    }[],
    height: size.y * scale,
    frameBounds,
    scale,
    duration,
    work(time: number, amount = 1) {
      ticks.forEach((fn) => fn(time % duration));
      moving.scale.setScalar(Math.max(0.001, amount));
      root.position.copy(rest);
    },
    technical(value: number) {
      root.updateMatrixWorld(true);
      scanUniforms.uBodyInverse.value.copy(root.matrixWorld).invert();
      scanUniforms.uBodyScan.value = T.MathUtils.lerp(
        bounds.min.x - 0.2,
        bounds.max.x + 0.2,
        value,
      );
      scanUniforms.uBodyTech.value = value;
      wire.opacity = value > 0.001 ? 0.6 : 0;
      technicalEdges.forEach((edge) => (edge.visible = value > 0.001));
      for (const mat of materialSet) {
        mat.depthWrite = value < 0.001;
      }
    },
  };
}
