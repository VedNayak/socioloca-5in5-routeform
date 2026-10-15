/** Only the model nearest the viewport centre owns a body WebGL scene. */
type Panel = {
  element: HTMLElement;
  eligible: () => boolean;
  activate: (on: boolean) => void;
};
const panels = new Set<Panel>();
let owner: Panel | undefined,
  preferred: Panel | undefined,
  preferredAt = 0,
  frame = 0;
function update() {
  frame = 0;
  let best: Panel | undefined,
    distance = Infinity;
  if (preferred && Math.abs(scrollY - preferredAt) > 90) preferred = undefined;
  for (const p of panels) {
    if (!p.eligible()) continue;
    const rect = p.element.getBoundingClientRect();
    if (rect.top > innerHeight - 100 || rect.bottom < 120) continue;
    const d = p.element
      .querySelector(".assembly-host")
      ?.contains(document.activeElement)
      ? -2
      : p === preferred
        ? -1
        : Math.abs(
            rect.top + Math.min(rect.height, innerHeight) / 2 - innerHeight / 2,
          );
    if (d < distance) {
      best = p;
      distance = d;
    }
  }
  if (best === owner) return;
  owner?.activate(false);
  owner = best;
  owner?.activate(true);
}
function schedule() {
  if (!frame) frame = requestAnimationFrame(update);
}
export function registerAssembly(panel: Panel) {
  if (!panels.size) {
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
  }
  panels.add(panel);
  schedule();
  return {
    refresh: schedule,
    prefer: () => {
      preferred = panel;
      preferredAt = scrollY;
      schedule();
    },
    dispose: () => {
      if (owner === panel) {
        panel.activate(false);
        owner = undefined;
      }
      if (preferred === panel) preferred = undefined;
      panels.delete(panel);
      schedule();
      if (!panels.size) {
        cancelAnimationFrame(frame);
        frame = 0;
        window.removeEventListener("scroll", schedule);
        window.removeEventListener("resize", schedule);
      }
    },
  };
}
