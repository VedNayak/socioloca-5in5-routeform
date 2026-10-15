import * as T from "three";
import { disposeVehicle, type VehicleKind } from "./vehicles";
import { createBodyModel } from "./body-models";
import type { BodyStudy } from "./body-studies";
const lerp = T.MathUtils.lerp;

export type AssemblyState = {
  time: number;
  yaw: number;
  pitch: number;
  technical: number;
};
export type AssemblyRenderer = {
  suspend: () => { image: string; state: AssemblyState };
  reset: () => void;
  pause: (paused: boolean) => void;
  technical: (enabled: boolean) => void;
  dispose: () => void;
};
export function createAssemblyRenderer(
  host: HTMLElement,
  kind: VehicleKind,
  onError: () => void,
  study: BodyStudy,
  resume?: AssemblyState,
): AssemblyRenderer {
  const renderer = new T.WebGLRenderer({
    alpha: true,
    antialias: true,
    powerPreference: "low-power",
  });
  renderer.setPixelRatio(Math.min(1.5, devicePixelRatio));
  renderer.setClearColor("#101d21", 1);
  renderer.outputColorSpace = T.SRGBColorSpace;
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = T.PCFSoftShadowMap;
  host.append(renderer.domElement);
  const scene = new T.Scene(),
    cam = new T.OrthographicCamera(-10, 10, 7, -7, 0.1, 150);
  const vehicle = createBodyModel(study);
  const frameCorners: T.Vector3[] = [];
  for (const x of [vehicle.frameBounds.min.x, vehicle.frameBounds.max.x])
    for (const y of [vehicle.frameBounds.min.y, vehicle.frameBounds.max.y])
      for (const z of [vehicle.frameBounds.min.z, vehicle.frameBounds.max.z])
        frameCorners.push(new T.Vector3(x, y, z));
  const cameraPoint = new T.Vector3();
  host.dataset.subject = kind;
  scene.add(vehicle.root);
  scene.add(new T.HemisphereLight("#e9f0ed", "#172b31", 1.7));
  const key = new T.DirectionalLight("#fff1df", 3.2);
  key.position.set(5, 14, 8);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  Object.assign(key.shadow.camera, {
    left: -13,
    right: 13,
    top: 13,
    bottom: -13,
    near: 1,
    far: 40,
  });
  key.shadow.bias = -0.0002;
  key.shadow.normalBias = 0.035;
  scene.add(key);
  const rim = new T.DirectionalLight("#a9d4dd", 2.1);
  rim.position.set(-7, 4, -5);
  scene.add(rim);
  const grid = new T.GridHelper(20, 4, "#273b3d", "#1b2e31");
  grid.position.y = -0.1;
  scene.add(grid);
  const ground = new T.Mesh(
    new T.PlaneGeometry(80, 80),
    new T.ShadowMaterial({ opacity: 0.24, color: 0x000000 }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.035;
  ground.receiveShadow = true;
  scene.add(ground);
  const envCanvas = document.createElement("canvas");
  envCanvas.width = 512;
  envCanvas.height = 256;
  const ec = envCanvas.getContext("2d")!;
  ec.fillStyle = "#17262c";
  ec.fillRect(0, 0, 512, 256);
  for (const [x, y, w, h] of [
    [50, 30, 85, 50],
    [275, 10, 50, 95],
    [425, 75, 70, 23],
  ]) {
    const gradient = ec.createRadialGradient(
      x + w / 2,
      y + h / 2,
      1,
      x + w / 2,
      y + h / 2,
      w * 0.7,
    );
    gradient.addColorStop(0, "#f6efe1");
    gradient.addColorStop(0.5, "#c2d3d1");
    gradient.addColorStop(1, "#17262c");
    ec.fillStyle = gradient;
    ec.fillRect(x - w * 0.3, y - h * 0.3, w * 1.6, h * 1.6);
  }
  const envTexture = new T.CanvasTexture(envCanvas);
  envTexture.mapping = T.EquirectangularReflectionMapping;
  envTexture.colorSpace = T.SRGBColorSpace;
  const pmrem = new T.PMREMGenerator(renderer),
    environment = pmrem.fromEquirectangular(envTexture);
  scene.environment = environment.texture;
  envTexture.dispose();
  pmrem.dispose();
  const axes = new T.Group();
  const floorMaterial = new T.LineBasicMaterial({
    color: "#ec7b42",
    transparent: true,
    opacity: 0.4,
  });
  for (const z of [-7, 7]) {
    const l = new T.Line(
      new T.BufferGeometry().setFromPoints([
        new T.Vector3(-9, 0, z),
        new T.Vector3(9, 0, z),
      ]),
      floorMaterial,
    );
    axes.add(l);
  }
  scene.add(axes);
  let alive = true,
    frame = 0,
    yaw = resume?.yaw ?? 0,
    pitch = resume?.pitch ?? 0,
    yawGoal = resume?.yaw ?? 0,
    pitchGoal = resume?.pitch ?? 0,
    paused = false,
    technical = resume?.technical ?? 0,
    technicalGoal = resume?.technical ?? 0,
    workTime = resume?.time ?? 0,
    lastDraw = -Infinity,
    previous = performance.now(),
    firstFrame = true;
  let drag: { x: number; y: number; yaw: number; pitch: number } | null = null;
  const fit = () => {
    const w = host.clientWidth,
      h = host.clientHeight;
    if (!w || !h) return;
    const half = w < 520 ? 7 : 6;
    cam.top = half;
    cam.bottom = -half;
    cam.left = (-half * w) / h;
    cam.right = -cam.left;
    cam.updateProjectionMatrix();
    renderer.setSize(w, h, false);
    kick();
  };
  const draw = (now: number) => {
    frame = 0;
    if (!alive) return;
    if (document.hidden) return;
    if (now - lastDraw < 1000 / 30) {
      frame = requestAnimationFrame(draw);
      return;
    }
    lastDraw = now;
    const dt = firstFrame
        ? 0
        : Math.max(0, Math.min(0.1, (now - previous) / 1000)),
      gain = 1 - Math.exp(-dt * 8);
    previous = now;
    firstFrame = false;
    yaw = lerp(yaw, yawGoal, gain);
    pitch = lerp(pitch, pitchGoal, gain);
    const heading =
        Math.PI / 4 + yaw + (study === "services-road" ? Math.PI : 0),
      elevation = (34 * Math.PI) / 180 + pitch;
    const c = {
        sn: Math.sin(heading),
        cs: Math.cos(heading),
        ce: Math.cos(elevation),
        se: Math.sin(elevation),
      },
      distance = 28;
    cam.position.set(
      c.sn * c.ce * distance,
      c.se * distance + vehicle.height * 0.28,
      c.cs * c.ce * distance,
    );
    cam.lookAt(0, vehicle.height * 0.5, 0);
    cam.updateMatrixWorld(true);
    const aspect = host.clientWidth / Math.max(1, host.clientHeight);
    let frameHalf = host.clientWidth < 520 ? 6 : 5;
    for (const corner of frameCorners) {
      cameraPoint.copy(corner).applyMatrix4(cam.matrixWorldInverse);
      frameHalf = Math.max(
        frameHalf,
        Math.abs(cameraPoint.y) * 1.18,
        (Math.abs(cameraPoint.x) / aspect) * 1.18,
      );
    }
    cam.top = frameHalf;
    cam.bottom = -frameHalf;
    cam.left = -frameHalf * aspect;
    cam.right = -cam.left;
    cam.updateProjectionMatrix();
    if (!paused) workTime += dt;
    vehicle.work(workTime);
    technical = lerp(technical, technicalGoal, gain);
    vehicle.technical(technical);
    renderer.render(scene, cam);
    host.dataset.assemblyProgress = "1.000";
    host.dataset.cameraYaw = yaw.toFixed(3);
    host.dataset.workTime = workTime.toFixed(3);
    host.dataset.working = String(!paused);
    host.dataset.technical = technical.toFixed(3);
    host.dataset.cycle = (workTime % vehicle.duration).toFixed(3);
    if (
      Math.abs(yaw - yawGoal) > 0.001 ||
      Math.abs(pitch - pitchGoal) > 0.001 ||
      Math.abs(technical - technicalGoal) > 0.001 ||
      !paused
    )
      kick();
  };
  function kick() {
    if (!frame && alive) {
      frame = requestAnimationFrame(draw);
    }
  }
  const move = (event: PointerEvent) => {
    if (event.pointerType !== "mouse") return;
    const rect = host.getBoundingClientRect();
    yawGoal = drag
      ? Math.max(
          -0.6,
          Math.min(0.6, drag.yaw + (event.clientX - drag.x) * 0.004),
        )
      : ((event.clientX - rect.left) / rect.width - 0.5) * 0.18;
    pitchGoal = drag
      ? Math.max(
          -0.23,
          Math.min(0.23, drag.pitch + (event.clientY - drag.y) * 0.003),
        )
      : ((event.clientY - rect.top) / rect.height - 0.5) * 0.05;
    kick();
  };
  const down = (e: PointerEvent) => {
    if (e.pointerType === "mouse" && e.button === 0) {
      drag = { x: e.clientX, y: e.clientY, yaw, pitch };
      host.setPointerCapture(e.pointerId);
    }
  };
  const up = (e: PointerEvent) => {
    drag = null;
    if (host.hasPointerCapture(e.pointerId))
      host.releasePointerCapture(e.pointerId);
  };
  const reset = () => {
    yawGoal = 0;
    pitchGoal = 0;
    kick();
  };
  const keyboard = (e: KeyboardEvent) => {
    if (
      [
        "ArrowLeft",
        "ArrowRight",
        "ArrowUp",
        "ArrowDown",
        "Home",
        "Escape",
      ].includes(e.key)
    ) {
      e.preventDefault();
      if (e.key === "Home" || e.key === "Escape") reset();
      else {
        yawGoal = Math.max(
          -0.6,
          Math.min(
            0.6,
            yawGoal +
              (e.key === "ArrowRight"
                ? 0.12
                : e.key === "ArrowLeft"
                  ? -0.12
                  : 0),
          ),
        );
        pitchGoal = Math.max(
          -0.23,
          Math.min(
            0.23,
            pitchGoal +
              (e.key === "ArrowDown" ? 0.06 : e.key === "ArrowUp" ? -0.06 : 0),
          ),
        );
        kick();
      }
    }
  };
  const lost = (e: Event) => {
    e.preventDefault();
    onError();
  };
  renderer.domElement.addEventListener("webglcontextlost", lost);
  host.addEventListener("pointermove", move);
  host.addEventListener("pointerdown", down);
  host.addEventListener("pointerup", up);
  host.addEventListener("pointercancel", up);
  host.addEventListener("dblclick", reset);
  host.addEventListener("keydown", keyboard);
  const resize = new ResizeObserver(fit);
  const visibility = () => {
    if (document.hidden) {
      cancelAnimationFrame(frame);
      frame = 0;
    } else kick();
  };
  document.addEventListener("visibilitychange", visibility);
  resize.observe(host);
  fit();
  // Populate the framebuffer before React exposes the canvas.
  cancelAnimationFrame(frame);
  frame = 0;
  draw(performance.now());
  return {
    suspend() {
      // Copy the actual lit frame before releasing its WebGL context.
      renderer.render(scene, cam);
      return {
        image: renderer.domElement.toDataURL("image/webp", 0.92),
        state: { time: workTime, yaw, pitch, technical },
      };
    },
    reset,
    pause(value) {
      paused = value;
      kick();
    },
    technical(value) {
      technicalGoal = value ? 1 : 0;
      kick();
    },
    dispose() {
      alive = false;
      cancelAnimationFrame(frame);
      resize.disconnect();
      document.removeEventListener("visibilitychange", visibility);
      host.removeEventListener("pointermove", move);
      host.removeEventListener("pointerdown", down);
      host.removeEventListener("pointerup", up);
      host.removeEventListener("pointercancel", up);
      host.removeEventListener("dblclick", reset);
      host.removeEventListener("keydown", keyboard);
      renderer.domElement.removeEventListener("webglcontextlost", lost);
      disposeVehicle(vehicle.root);
      vehicle.root.traverse((o) => {
        if (o instanceof T.InstancedMesh) o.dispose();
      });
      ground.geometry.dispose();
      ground.material.dispose();
      environment.dispose();
      key.shadow.dispose();
      grid.geometry.dispose();
      for (const m of Array.isArray(grid.material)
        ? grid.material
        : [grid.material])
        m.dispose();
      axes.children.forEach((o) => (o as T.Line).geometry.dispose());
      floorMaterial.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    },
  };
}
