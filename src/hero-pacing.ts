/** Prepare only the visible opening after its first paint, before the first swipe.
 * Native scroll stays untouched; reduced-motion openings never call this helper. */
export function prepareHeroOnIdle(element: HTMLElement, prepare: () => void) {
  let idle: number | undefined;
  const timer = window.setTimeout(() => {
    const run = () => {
      const bounds = element.getBoundingClientRect();
      if (element.isConnected && bounds.bottom > 0 && bounds.top < innerHeight)
        prepare();
    };
    if ("requestIdleCallback" in window)
      idle = window.requestIdleCallback(run, { timeout: 1200 });
    else run();
  }, 900);
  return () => {
    clearTimeout(timer);
    if (idle !== undefined) window.cancelIdleCallback(idle);
  };
}

/** The first deliberate scroll plays a complete reveal beat, never an
 * arrival autoplay. The director eases to this target rather than jumping.
 * Remaining native scroll carries the separation and final formation. */
export function heroStoryProgress(scroll: number) {
  const p = Math.max(0, Math.min(1, scroll));
  if (p <= 0.008) return 0;
  return 0.36 + ((p - 0.008) * 0.64) / 0.992;
}
/** Chapter controls preserve their original story destinations. */
export function heroScrollPosition(story: number) {
  const p = Math.max(0, Math.min(1, story));
  if (p === 0) return 0;
  return 0.008 + (Math.max(0, p - 0.36) * 0.992) / 0.64;
}
