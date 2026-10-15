/** Keep visible studies stable together; lease at most three body renderers. */
type Panel = {
  element: HTMLElement;
  eligible: () => boolean;
  activate: (on: boolean) => void;
};
const panels = new Set<Panel>();
const active = new Set<Panel>();
let preferred: Panel | undefined,
  preferredAt = 0,
  frame = 0;
function update() {
  frame = 0;
  if (preferred && Math.abs(scrollY - preferredAt) > 90) preferred = undefined;
  const candidates: { panel: Panel; score: number }[] = [];
  for (const panel of panels) {
    if (!panel.eligible()) continue;
    const rect = panel.element.getBoundingClientRect();
    if (rect.top > innerHeight + 120 || rect.bottom < -120) continue;
    const visible = rect.top < innerHeight && rect.bottom > 0;
    const focused = panel.element.contains(document.activeElement);
    const priority =
      panel === preferred
        ? -3
        : focused
          ? -2
          : Math.abs(rect.top + rect.height / 2 - innerHeight / 2);
    candidates.push({ panel, score: (visible ? 0 : 100000) + priority });
  }
  candidates.sort((a, b) => a.score - b.score);
  const next = new Set(candidates.slice(0, 3).map((c) => c.panel));
  for (const panel of active)
    if (!next.has(panel)) {
      panel.activate(false);
      active.delete(panel);
    }
  for (const panel of next)
    if (!active.has(panel)) {
      active.add(panel);
      panel.activate(true);
    }
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
      if (active.delete(panel)) panel.activate(false);
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
