import { useEffect, useRef, useState } from "react";
/** Scroll drives editorial sequences. Manual choices remain until the next deliberate scroll. */
export function useScrollSequence(count: number) {
  const root = useRef<HTMLElement>(null),
    selection = useRef<number | null>(null),
    selectedAt = useRef(0);
  const [active, setActive] = useState(0),
    [enabled, setEnabled] = useState(false);
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    const update = () => {
      frame = 0;
      if (reduced.matches) return;
      const rect = el.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > innerHeight) return;
      if (
        selection.current !== null &&
        Math.abs(scrollY - selectedAt.current) < 90
      )
        return;
      selection.current = null;
      const distance = Math.max(
        1,
        el.offsetHeight - Math.min(innerHeight - 104, 850),
      );
      const progress = Math.max(
        0,
        Math.min(0.999, (104 - rect.top) / distance),
      );
      const value = Math.min(count - 1, Math.floor(progress * count));
      setActive(value);
      el.style.setProperty("--sequence-progress", String(progress));
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    const mode = () => {
      setEnabled(!reduced.matches);
      selection.current = null;
      schedule();
    };
    mode();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    reduced.addEventListener("change", mode);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      reduced.removeEventListener("change", mode);
    };
  }, [count]);
  const choose = (index: number) => {
    selection.current = index;
    selectedAt.current = scrollY;
    setActive(index);
  };
  return { root, active, choose, enabled };
}
