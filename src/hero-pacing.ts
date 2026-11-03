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
