import * as T from "three";
import { createVehicle, disposeVehicle, type VehicleKind } from "./vehicles";
import {
  camera as skylineCamera,
  easeInOutCubic,
  lerp,
  riseAt,
} from "../components/ui/skyline-math";

export type AssemblyRenderer = {
  update: (value: number) => void;
  reset: () => void;
  pause: (paused: boolean) => void;
  dispose: () => void;
};
export function createAssemblyRenderer(
  host: HTMLElement,
  kind: VehicleKind,
  onError: () => void,
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
  renderer.toneMappingExposure = 1.55;
  host.append(renderer.domElement);
  const scene = new T.Scene(),
    cam = new T.OrthographicCamera(-10, 10, 7, -7, 0.1, 150);
  const vehicle = createVehicle(kind);
  scene.add(vehicle.root);
  scene.add(new T.HemisphereLight("#dcebe7", "#524d39", 2.2));
  const key = new T.DirectionalLight("#fff1df", 3.6);
  key.position.set(5, 14, 8);
  scene.add(key);
  const rim = new T.DirectionalLight("#ff7438", 2.1);
  rim.position.set(-7, 4, -5);
  scene.add(rim);
  const grid = new T.GridHelper(20, 20, "#405b5b", "#25393b");
  grid.position.y = -0.1;
  scene.add(grid);
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
    goal = 1,
    progress = 1,
    yaw = 0,
    pitch = 0,
    yawGoal = 0,
    pitchGoal = 0,
    paused = false,
    workTime = 0,
    lastDraw = 0,
    previous = performance.now();
  let drag: { x: number; y: number; yaw: number; pitch: number } | null = null;
  const fit = () => {
    const w = host.clientWidth,
      h = host.clientHeight;
    if (!w || !h) return;
    const half = w < 520 ? 9 : 8;
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
    const dt = Math.min(0.05, (now - previous) / 1000),
      gain = 1 - Math.exp(-dt * 8);
    previous = now;
    progress =
      Math.abs(goal - progress) < 0.001 ? goal : lerp(progress, goal, gain);
    yaw = lerp(yaw, yawGoal, gain);
    pitch = lerp(pitch, pitchGoal, gain);
    const e = easeInOutCubic(progress),
      c = skylineCamera(e, yaw, pitch),
      distance = 28;
    cam.position.set(
      c.sn * c.ce * distance,
      c.se * distance + vehicle.height * 0.28,
      c.cs * c.ce * distance,
    );
    cam.lookAt(0, vehicle.height * 0.34 * e, 0);
    for (const p of vehicle.parts) {
      const rise = riseAt(progress, p.column, 18, p.row, 12);
      p.group.position.y = p.home.y * Math.max(0.018, rise);
      p.group.scale.y = Math.max(0.018, rise);
    }
    if (!paused && progress > 0.9) workTime += dt;
    vehicle.work(workTime, Math.max(0, Math.min(1, (progress - 0.88) / 0.12)));
    vehicle.wire.opacity = 0.45 * (1 - e) + 0.1;
    renderer.render(scene, cam);
    host.dataset.assemblyProgress = progress.toFixed(3);
    host.dataset.cameraYaw = yaw.toFixed(3);
    host.dataset.workTime = workTime.toFixed(3);
    host.dataset.working = String(!paused && progress > 0.9);
    if (
      Math.abs(goal - progress) > 0.001 ||
      Math.abs(yaw - yawGoal) > 0.001 ||
      Math.abs(pitch - pitchGoal) > 0.001 ||
      (!paused && goal > 0.9)
    )
      kick();
  };
  function kick() {
    if (!frame && alive) {
      previous = performance.now();
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
  return {
    update(value) {
      goal = value;
      kick();
    },
    reset,
    pause(value) {
      paused = value;
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
