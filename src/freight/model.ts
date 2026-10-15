import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";

export type CargoPart = {
  group: THREE.Group;
  home: THREE.Vector3;
  direction: THREE.Vector3;
};

/** Original, metre-proportioned 40ft cargo geometry. No downloaded model. */
export function createCargoModel() {
  const root = new THREE.Group();
  const solid = new THREE.Group();
  const lattice = new THREE.Group();
  const parts: CargoPart[] = [];
  const orange = new THREE.MeshStandardMaterial({
    color: 0xd65321,
    roughness: 0.42,
    metalness: 0.65,
    transparent: true,
  });
  const steel = new THREE.MeshStandardMaterial({
    color: 0x343e40,
    roughness: 0.37,
    metalness: 0.82,
    transparent: true,
  });
  const cast = new THREE.MeshStandardMaterial({
    color: 0x6f7775,
    roughness: 0.5,
    metalness: 0.8,
    transparent: true,
  });
  const wire = new THREE.LineBasicMaterial({
    color: 0xaedbd9,
    transparent: true,
    opacity: 0,
  });
  const materials = [orange, steel, cast];
  const box = (
    parent: THREE.Object3D,
    w: number,
    h: number,
    d: number,
    x: number,
    y: number,
    z: number,
    mat = orange,
    rounded = false,
  ) => {
    const geometry = rounded
      ? new RoundedBoxGeometry(w, h, d, 2, 0.035)
      : new THREE.BoxGeometry(w, h, d);
    const mesh = new THREE.Mesh(geometry, mat);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    const edges = new THREE.LineSegments(
      new THREE.EdgesGeometry(geometry, 35),
      wire,
    );
    edges.position.copy(mesh.position);
    edges.userData.owner = parent;
    edges.userData.offset = mesh.position.clone();
    lattice.add(edges);
    return mesh;
  };
  const part = (direction: THREE.Vector3) => {
    const group = new THREE.Group();
    solid.add(group);
    parts.push({ group, home: group.position.clone(), direction });
    return group;
  };
  const front = part(new THREE.Vector3(0, 0.2, 1.9));
  const back = part(new THREE.Vector3(0, 0.4, -1.9));
  const roof = part(new THREE.Vector3(0, 2.6, 0));
  const base = part(new THREE.Vector3(0, -0.8, 0));
  const doors = part(new THREE.Vector3(2.3, 0.3, 0));
  const nose = part(new THREE.Vector3(-1.6, 0.3, 0));
  box(front, 12.19, 2.53, 0.075, 0, 2.5, 1.2);
  box(back, 12.19, 2.53, 0.075, 0, 2.5, -1.2);
  box(roof, 12.19, 0.1, 2.44, 0, 3.82, 0);
  box(base, 12.19, 0.15, 2.44, 0, 1.18, 0, steel);
  box(nose, 0.09, 2.6, 2.44, -6.1, 2.5, 0);
  box(doors, 0.09, 2.56, 2.4, 6.1, 2.5, 0);
  const ribGeometry = new THREE.BoxGeometry(0.055, 2.42, 0.08);
  for (const [group, z] of [
    [front, 1.28],
    [back, -1.28],
  ] as const) {
    const ribs = new THREE.InstancedMesh(ribGeometry, orange, 54);
    const matrix = new THREE.Matrix4();
    for (let i = 0; i < 54; i++) {
      matrix.makeTranslation(-5.88 + i * 0.221, 2.5, z);
      ribs.setMatrixAt(i, matrix);
    }
    group.add(ribs);
    ribs.castShadow = true;
    const ribEdges = new THREE.EdgesGeometry(ribGeometry).getAttribute(
      "position",
    );
    const coordinates: number[] = [];
    for (let i = 0; i < 54; i++)
      for (let n = 0; n < ribEdges.count; n++)
        coordinates.push(
          ribEdges.getX(n) - 5.88 + i * 0.221,
          ribEdges.getY(n) + 2.5,
          ribEdges.getZ(n) + z,
        );
    const edgeGeometry = new THREE.BufferGeometry();
    edgeGeometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(coordinates, 3),
    );
    const detail = new THREE.LineSegments(edgeGeometry, wire);
    detail.userData.owner = group;
    detail.userData.offset = new THREE.Vector3();
    lattice.add(detail);
  }
  for (const y of [1.2, 3.8])
    for (const z of [-1.21, 1.21]) box(solid, 12.23, 0.12, 0.12, 0, y, z);
  for (const x of [-6.05, 6.05])
    for (const z of [-1.2, 1.2]) {
      box(solid, 0.14, 2.68, 0.14, x, 2.5, z);
      for (const y of [1.22, 3.79])
        box(solid, 0.23, 0.2, 0.23, x, y, z, cast, true);
    }
  for (const z of [-0.82, -0.26, 0.26, 0.82])
    box(doors, 0.12, 2.3, 0.04, 6.19, 2.5, z, cast);
  for (const y of [1.6, 3.4]) box(doors, 0.13, 0.035, 2.27, 6.19, y, 0, cast);
  // Lifting frame and four cables give the photoreal plate a grounded purpose.
  const lift = new THREE.Group();
  solid.add(lift);
  for (const z of [-0.96, 0.96]) box(lift, 11.3, 0.18, 0.19, 0, 4.85, z, steel);
  for (const x of [-5.5, 5.5]) box(lift, 0.2, 0.18, 2.18, x, 4.85, 0, steel);
  const cableMaterial = new THREE.LineBasicMaterial({
    color: 0x414847,
    transparent: true,
  });
  for (const x of [-5.4, 5.4])
    for (const z of [-0.95, 0.95]) {
      const cable = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(x, 4.83, z),
          new THREE.Vector3(x * 0.48, 10, z * 0.48),
        ]),
        cableMaterial,
      );
      solid.add(cable);
      const attachment = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(x, 4.83, z),
          new THREE.Vector3(Math.sign(x) * 6.04, 3.88, Math.sign(z) * 1.19),
        ]),
        cableMaterial,
      );
      solid.add(attachment);
    }
  root.add(solid, lattice);
  root.position.x = 3.5;
  return { root, solid, lattice, parts, materials, wire, cableMaterial };
}

export function createStudioCamera(width: number, height: number) {
  const halfHeight = width < 821 ? 8.5 : 6.9,
    halfWidth = (halfHeight * width) / height;
  const camera = new THREE.OrthographicCamera(
    -halfWidth,
    halfWidth,
    halfHeight,
    -halfHeight,
    0.1,
    100,
  );
  camera.position.set(17, 10, 20);
  camera.lookAt(0, 2.6, 0);
  return camera;
}

export function disposeTree(root: THREE.Object3D) {
  const geometries = new Set<THREE.BufferGeometry>(),
    materials = new Set<THREE.Material>();
  root.traverse((obj) => {
    if (
      obj instanceof THREE.Mesh ||
      obj instanceof THREE.Line ||
      obj instanceof THREE.Points
    ) {
      geometries.add(obj.geometry);
      for (const m of Array.isArray(obj.material)
        ? obj.material
        : [obj.material])
        materials.add(m);
    }
  });
  geometries.forEach((g) => g.dispose());
  materials.forEach((m) => m.dispose());
}
