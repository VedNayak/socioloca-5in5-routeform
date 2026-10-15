import * as T from "three";
import type { OpeningKind } from "./hero-study";
import type { createHeroStudy } from "./hero-study";

/** Components retain their registered rest pose; scroll separates coherent
 * assemblies along physical axes. `reach` scales every separation evenly. */
export function createOpeningAssembly(
  study: ReturnType<typeof createHeroStudy>,
  kind: OpeningKind,
  reach = 1,
) {
  if (kind === "quote") {
    const shell = study.parts[0];
    shell.group.visible = false;
    const material = (shell.group.children[0] as T.Mesh).material;
    const panels = [
      [3.8, 0.07, 2.8, 0, 2.875, 0],
      [3.8, 0.07, 2.8, 0, 0.445, 0],
      [3.8, 2.43, 0.07, 0, 1.66, 1.365],
      [3.8, 2.43, 0.07, 0, 1.66, -1.365],
      [0.07, 2.43, 2.66, -1.865, 1.66, 0],
      [0.07, 2.43, 2.66, 1.865, 1.66, 0],
    ];
    for (const [w, h, d, x, y, z] of panels) {
      const group = new T.Group(),
        geometry = new T.BoxGeometry(w, h, d);
      group.add(
        new T.Mesh(geometry, material),
        new T.LineSegments(new T.EdgesGeometry(geometry), study.wire),
      );
      group.position.set(x, y, z);
      study.root.add(group);
      study.parts.push({
        group,
        home: group.position.clone(),
        column: x,
        row: z,
      });
    }
  }
  const parts = study.parts.map(({ group, home }, i) => {
    const delta = new T.Vector3();
    if (kind === "services") {
      if (i === 1 || i === 2) delta.set(0.1, 0.6, i === 1 ? 2.1 : -2.1);
      else if (i === 3 || i === 4) delta.set(-0.7, 0.8, i === 3 ? 0.9 : -0.9);
      else if (i === 5) delta.set(-0.45, 1.7, 0);
      else if (Math.abs(home.z) > 2)
        delta.set(0.6, -0.9, Math.sign(home.z) * 1.3);
      else if (home.y < 0.9) delta.set(0, -0.8, Math.sign(home.z) * 0.28);
    } else if (kind === "industries") {
      if (home.x > 1.3)
        delta.set(0.7, home.y > 0.8 ? 1.25 : 0.7, Math.sign(home.z) * 0.12);
      else if (home.x === 1.2) delta.set(0.5, 0.4, Math.sign(home.z) * 0.12);
      else if (home.y > 2.9) delta.set(0, 1.1, 0);
      else if (home.y > 1.8) delta.set(0, 0.45, Math.sign(home.z) * 0.3);
      else if (Math.abs(home.z) > 0.85)
        delta.set(0, -0.22, Math.sign(home.z) * 0.48);
    } else if (kind === "about") {
      if (home.y > 1.8 && home.x > -4.3)
        delta.set(home.x * 0.045, home.y > 2.6 ? 1.65 : 0.6, home.z * 0.45);
      else if (home.x < -4.3) delta.set(-0.45, 1.0, 0);
      else if (i === 1) delta.set(0, 0.25, 0);
    } else {
      if (home.y > 2.7) delta.set(0, 1.1, 0);
      else if (Math.abs(home.z) > 1.3)
        delta.set(0, 0.1, Math.sign(home.z) * 0.9);
      else if (Math.abs(home.x) > 1.7 && home.y > 1)
        delta.set(Math.sign(home.x) * 0.8, 0.1, 0);
      else if (home.y > 1 && Math.abs(home.x) > 1)
        delta.set(Math.sign(home.x) * 0.55, 0.15, 0);
      else if (home.y < 0.5) delta.set(0, -0.3, 0);
    }
    delta.multiplyScalar(reach);
    group.userData.explode = delta.clone().multiplyScalar(study.scale);
    return { group, home, delta, delay: Math.min(0.04, (i % 5) * 0.008) };
  });
  return {
    parts,
    update(amount: number) {
      for (const part of parts) {
        const x = T.MathUtils.clamp(
          (amount - part.delay) / (1 - part.delay),
          0,
          1,
        );
        part.group.position.copy(part.home).addScaledVector(part.delta, x);
      }
    },
  };
}
