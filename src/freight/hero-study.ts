import * as T from "three";
import { createVehicle, type VehicleKind } from "./vehicles";

export type OpeningKind = "services" | "industries" | "about" | "quote";
const subjects: Record<OpeningKind, VehicleKind> = {
  services: "plane",
  industries: "forklift",
  about: "ship",
  quote: "crate",
};
export const studioAspect = 16 / 9;

/** The same original meshes and calibrated camera create both the generation
 * reference and the live structural scene. No image edges become geometry. */
export function createHeroStudy(kind: OpeningKind) {
  const vehicle = createVehicle(subjects[kind]);
  vehicle.moving.visible = false;
  vehicle.wire.color.set("#a6c7c8");
  vehicle.wire.opacity = 0;
  const surfaces: T.MeshStandardMaterial[] = [];
  vehicle.root.traverse((o) => {
    if (
      o instanceof T.Mesh &&
      o.material instanceof T.MeshStandardMaterial &&
      !surfaces.includes(o.material)
    )
      surfaces.push(o.material);
  });
  // Aircraft cross sections convey fuselage volume without triangulation noise.
  if (kind === "services") {
    const ribMaterial = vehicle.wire;
    // Flush curved cockpit glazing replaces the symbolic body's raised box.
    vehicle.parts.forEach(({ group, home }) => {
      if (home.x === 5 && home.y === 1.61) group.visible = false;
    });
    const windowPoints: number[] = [];
    for (const x of [4.7, 5.65])
      for (let i = 0; i <= 8; i++) {
        const a = (0.22 + (i / 8) * 0.56) * Math.PI,
          r = Math.sqrt(1 - (x / 6.5) ** 2);
        windowPoints.push(
          x,
          1.1 + Math.sin(a) * 0.69 * r,
          Math.cos(a) * 0.735 * r,
        );
      }
    const windscreenGeometry = new T.BufferGeometry();
    windscreenGeometry.setAttribute(
      "position",
      new T.Float32BufferAttribute(windowPoints, 3),
    );
    const indices: number[] = [];
    for (let i = 0; i < 8; i++)
      indices.push(i, i + 1, i + 9, i + 1, i + 10, i + 9);
    windscreenGeometry.setIndex(indices);
    windscreenGeometry.computeVertexNormals();
    const glazing = new T.MeshStandardMaterial({
      color: "#173a45",
      metalness: 0.75,
      roughness: 0.18,
      side: T.DoubleSide,
    });
    surfaces.push(glazing);
    vehicle.root.add(
      new T.Mesh(windscreenGeometry, glazing),
      new T.LineSegments(
        new T.EdgesGeometry(windscreenGeometry, 28),
        ribMaterial,
      ),
    );
    vehicle.parts.forEach(({ group }) => {
      if (
        group.children.some(
          (o) => o instanceof T.Mesh && o.geometry.type === "SphereGeometry",
        )
      )
        group.children.forEach((o) => {
          if (o instanceof T.LineSegments) o.visible = false;
        });
    });
    for (let i = -5; i <= 5; i++) {
      const x = i * 1.03,
        r = Math.sqrt(1 - (x / 6.5) ** 2);
      const pts = Array.from({ length: 65 }, (_, n) => {
        const angle = (n / 64) * Math.PI * 2;
        return new T.Vector3(
          x,
          1.1 + Math.sin(angle) * 0.683 * r,
          Math.cos(angle) * 0.723 * r,
        );
      });
      vehicle.root.add(
        new T.Line(new T.BufferGeometry().setFromPoints(pts), ribMaterial),
      );
    }
    for (let j = 0; j < 8; j++) {
      const angle = (j / 8) * Math.PI * 2;
      const pts = Array.from({ length: 65 }, (_, n) => {
        const t = (n / 64) * Math.PI,
          x = Math.cos(t) * 6.5;
        return new T.Vector3(
          x,
          1.1 + Math.sin(t) * Math.sin(angle) * 0.683,
          Math.sin(t) * Math.cos(angle) * 0.723,
        );
      });
      vehicle.root.add(
        new T.Line(new T.BufferGeometry().setFromPoints(pts), ribMaterial),
      );
    }
  }
  vehicle.root.updateMatrixWorld(true);
  const center = new T.Box3()
    .setFromObject(vehicle.root)
    .getCenter(new T.Vector3());
  const camera = new T.OrthographicCamera(-16, 16, 9, -9, 0.1, 150);
  const direction =
    kind === "industries"
      ? new T.Vector3(15, 8, 20)
      : kind === "about"
        ? new T.Vector3(18, 13, 22)
        : kind === "quote"
          ? new T.Vector3(15, 10, 20)
          : new T.Vector3(19, 14, 25);
  camera.position.copy(center).add(direction);
  camera.lookAt(center);
  camera.updateMatrixWorld(true);
  const corners: T.Vector3[] = [];
  vehicle.root.traverse((obj) => {
    if (!(obj instanceof T.Mesh)) return;
    const p = obj.geometry.getAttribute("position");
    for (let i = 0; i < p.count; i++)
      corners.push(
        new T.Vector3()
          .fromBufferAttribute(p, i)
          .applyMatrix4(obj.matrixWorld)
          .applyMatrix4(camera.matrixWorldInverse),
      );
  });
  const bounds = new T.Box3().setFromPoints(corners),
    size = bounds.getSize(new T.Vector3()),
    mid = bounds.getCenter(new T.Vector3());
  const width = kind === "industries" ? 0.44 : kind === "about" ? 0.64 : 0.49;
  const height = kind === "quote" ? 0.59 : 0.56;
  const spanY = Math.max(size.y / height, size.x / (studioAspect * width)),
    spanX = spanY * studioAspect;
  const cx = kind === "industries" ? 0.285 : kind === "about" ? 0.62 : 0.725;
  const cy = kind === "about" ? 0.66 : 0.55;
  const left = mid.x - cx * spanX,
    top = mid.y + cy * spanY;
  const fit = (w: number, h: number, portrait: boolean) => {
    // Portrait is a camera reframe of the same model; the generated mobile
    // poster uses this exact crop from the landscape master.
    const sourceAspect = portrait ? 0.72 : studioAspect;
    const retained = sourceAspect / studioAspect;
    const cropX = portrait
      ? Math.max(0, Math.min(1 - retained, cx - retained / 2))
      : 0;
    const scale = Math.max(w / sourceAspect, h);
    const coverX = w / (sourceAspect * scale),
      coverY = h / scale;
    const xPosition = portrait
      ? 0.5
      : kind === "industries"
        ? 0
        : kind === "about"
          ? 0.65
          : 1;
    const leftUV = cropX + retained * (1 - coverX) * xPosition;
    const topUV = (1 - coverY) * (portrait ? 0.65 : 0.5);
    camera.left = left + spanX * leftUV;
    camera.right = camera.left + spanX * retained * coverX;
    camera.top = top - spanY * topUV;
    camera.bottom = camera.top - spanY * coverY;
    camera.updateProjectionMatrix();
    return { cropX, retained, cx };
  };
  fit(1600, 900, false);
  const readingFrame = (
    w: number,
    h: number,
    t: number,
    start = 0.515,
    end = 0.805,
  ) => {
    const cy = (start + end) / 2;
    const sy = Math.max(
        size.y / Math.max(0.08, end - start),
        size.x / ((w / h) * 0.84),
      ),
      sx = (sy * w) / h;
    camera.left = T.MathUtils.lerp(camera.left, mid.x - sx * 0.5, t);
    camera.right = T.MathUtils.lerp(camera.right, mid.x + sx * 0.5, t);
    camera.top = T.MathUtils.lerp(camera.top, mid.y + sy * cy, t);
    camera.bottom = T.MathUtils.lerp(camera.bottom, mid.y - sy * (1 - cy), t);
    camera.updateProjectionMatrix();
  };
  return { ...vehicle, camera, surfaces, fit, readingFrame, cx };
}
