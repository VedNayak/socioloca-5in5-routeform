import { useEffect, useRef, useState } from "react";
import { RotateCcw, Pause, Play, ScanLine } from "lucide-react";
import { useLocation } from "react-router-dom";
import { bodyStudies, type BodyStudy } from "../../freight/body-studies";
import type { AssemblyRenderer } from "../../freight/assembly-renderer";
import type { VehicleKind } from "../../freight/vehicles";
import { registerAssembly } from "../../freight/assembly-pool";

const subjects: Record<string, VehicleKind> = {
  port: "ship",
  air: "plane",
  road: "truck",
  warehouse: "forklift",
  electronics: "crate",
  food: "plane",
  industrial: "truck",
};
const names: Record<VehicleKind, string> = {
  ship: "Container ship",
  plane: "Cargo aircraft",
  truck: "Container truck",
  forklift: "Forklift",
  crate: "Packed cargo",
};
/** Working geometry by default. Static projections of these same meshes provide
 * the no-WebGL/reduced-motion view; visible panels share a bounded renderer budget. */
export default function MediaAssembly({
  name,
  className = "",
}: {
  name: string;
  alt: string;
  className?: string;
  eager?: boolean;
}) {
  const root = useRef<HTMLElement>(null),
    host = useRef<HTMLDivElement>(null);
  const engine = useRef<AssemblyRenderer | undefined>(undefined);
  const prefer = useRef<(() => void) | undefined>(undefined);
  const [ready, setReady] = useState(false),
    [enhanced, setEnhanced] = useState(false);
  const [unavailable, setUnavailable] = useState(false),
    [paused, setPaused] = useState(false);
  const pausedRef = useRef(false),
    kind = subjects[name] ?? "crate";
  const route = useLocation().pathname.split("/").filter(Boolean)[0] || "home";
  const study = `${route}-${name}` as BodyStudy;
  const descriptor = bodyStudies[study];
  const [technical, setTechnical] = useState(false);
  const technicalRef = useRef(false);
  useEffect(() => {
    const el = root.current,
      target = host.current;
    if (!el || !target) return;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)");
    let alive = true,
      leased = false,
      failed = false,
      generation = 0;
    const stop = () => {
      leased = false;
      generation++;
      engine.current?.dispose();
      engine.current = undefined;
      if (alive) setReady(false);
    };
    const activate = async (on: boolean) => {
      if (!on) {
        stop();
        return;
      }
      leased = true;
      const id = ++generation;
      try {
        const { createAssemblyRenderer } =
          await import("../../freight/assembly-renderer");
        if (!alive || !leased || id !== generation || reduce.matches) return;
        engine.current = createAssemblyRenderer(
          target,
          kind,
          () => {
            failed = true;
            setUnavailable(true);
            if (target.contains(document.activeElement))
              el.focus({ preventScroll: true });
            stop();
          },
          study,
        );
        engine.current.pause(pausedRef.current);
        engine.current.technical(technicalRef.current);
        setReady(true);
      } catch {
        failed = true;
        setUnavailable(true);
        stop();
      }
    };
    const panel = registerAssembly({
      element: el,
      eligible: () => alive && !reduce.matches && !failed,
      activate: (on) => {
        void activate(on);
      },
    });
    prefer.current = panel.prefer;
    const changed = () => {
      setEnhanced(!reduce.matches);
      if (reduce.matches) stop();
      panel.refresh();
    };
    changed();
    reduce.addEventListener("change", changed);
    return () => {
      alive = false;
      panel.dispose();
      stop();
      prefer.current = undefined;
      reduce.removeEventListener("change", changed);
    };
  }, [kind, study]);
  return (
    <figure
      ref={root}
      tabIndex={-1}
      className={`photo image-relief media-assembly ${ready ? "relief-ready" : ""} ${className}`}
      data-model={kind}
      data-study={study}
      data-relief-view="model"
      onPointerEnter={() => prefer.current?.()}
      onFocusCapture={() => prefer.current?.()}
    >
      <div className="relief-housing">
        <svg
          className="assembly-static"
          viewBox="0 0 640 440"
          role="img"
          aria-label={`${names[kind]}. Illustrative model, static view.`}
          aria-hidden={ready}
        >
          <use href={`/geometry/${study}.svg#study`} />
        </svg>
        <div
          ref={host}
          className="assembly-host"
          tabIndex={ready ? 0 : -1}
          role="img"
          aria-label={`Illustrative working ${names[kind].toLowerCase()} model. Drag or use arrow keys to orbit; Home resets.`}
          aria-hidden={!ready}
          onFocus={() => prefer.current?.()}
        />
        <span className="relief-edge" aria-hidden="true" />
        <span className="assembly-label mono">
          {(descriptor?.title ?? names[kind]).toUpperCase()} / ILLUSTRATIVE
        </span>
      </div>
      <div className="relief-toolbar">
        <figcaption>
          {enhanced && !unavailable
            ? `${descriptor?.action.toUpperCase() ?? "WORKING STUDY"} / DRAG TO INSPECT`
            : "ORIGINAL GEOMETRY / INDEPENDENT CONCEPT"}
        </figcaption>
        {unavailable && (
          <span className="assembly-unavailable mono" role="status">
            3D unavailable / static geometry
          </span>
        )}
        {enhanced && !unavailable && (
          <div role="group" aria-label="Object controls">
            <button
              type="button"
              aria-label="Toggle technical view"
              aria-pressed={technical}
              onClick={() => {
                const next = !technical;
                technicalRef.current = next;
                setTechnical(next);
                prefer.current?.();
                engine.current?.technical(next);
              }}
            >
              <ScanLine size={15} />
            </button>
            <button
              type="button"
              aria-label={
                paused ? "Play working animation" : "Pause working animation"
              }
              aria-pressed={paused}
              onClick={() => {
                const next = !paused;
                pausedRef.current = next;
                setPaused(next);
                prefer.current?.();
                engine.current?.pause(next);
              }}
            >
              {paused ? <Play size={15} /> : <Pause size={15} />}
            </button>
            <button
              type="button"
              aria-label="Reset object camera"
              onClick={() => {
                prefer.current?.();
                engine.current?.reset();
              }}
            >
              <RotateCcw size={15} />
            </button>
          </div>
        )}
      </div>
    </figure>
  );
}
