import { useEffect, useRef } from "react";

const names = [
  "Cargo inspection",
  "Route planning",
  "Packing and preparation",
  "Cargo transport",
  "Destination handover",
];

/** Original operational diagrams. Each activation is a finite animation, never an idle loop. */
export default function JourneyIcon({ stage }: { stage: number }) {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    let disposed = false,
      revision = 0,
      revert: (() => void) | undefined;
    const begin = async () => {
      const run = ++revision;
      revert?.();
      revert = undefined;
      if (media.matches) return;
      const { gsap } = await import("gsap");
      if (disposed || run !== revision || media.matches) return;
      const ctx = gsap.context(() => {
        const tl = gsap.timeline({
          paused: true,
          defaults: { ease: "power2.out" },
          onComplete: () => {
            el.dataset.iconMotion = "complete";
          },
        });
        const ink = el.querySelectorAll<SVGGeometryElement>(".stage-ink");
        ink.forEach((path) => {
          const length = path.getTotalLength();
          tl.fromTo(
            path,
            { strokeDasharray: length, strokeDashoffset: length },
            { strokeDashoffset: 0, duration: 0.65 },
            0.05,
          );
        });
        tl.fromTo(
          el.querySelector(".icon-drawing"),
          { y: 7, opacity: 0.25 },
          { y: 0, opacity: 1, duration: 0.6 },
          0,
        );
        if (stage === 0) {
          tl.fromTo(
            ".inspection-scan",
            { y: -22, opacity: 0 },
            { y: 20, opacity: 0.9, duration: 0.9, ease: "sine.inOut" },
            0.3,
          ).to(".inspection-scan", { opacity: 0, duration: 0.2 }, 1.2);
        } else if (stage === 1) {
          const route = el.querySelector<SVGPathElement>(".planned-route")!;
          const marker = el.querySelector<SVGCircleElement>(".route-probe")!;
          const cursor = { progress: 0 },
            length = route.getTotalLength();
          tl.to(
            cursor,
            {
              progress: 1,
              duration: 1,
              ease: "sine.inOut",
              onUpdate: () => {
                const p = route.getPointAtLength(length * cursor.progress);
                marker.setAttribute("cx", String(p.x));
                marker.setAttribute("cy", String(p.y));
              },
            },
            0.25,
          );
          tl.fromTo(
            ".destination-ring",
            { scale: 0.65, opacity: 0.2, svgOrigin: "76 26" },
            { scale: 1, opacity: 1, duration: 0.45 },
            1,
          );
          // Attributes are restored by the effect cleanup as well as GSAP's context.
        } else if (stage === 2) {
          tl.fromTo(
            ".packing-flap-left",
            { rotation: -18, svgOrigin: "26 40" },
            { rotation: 0, duration: 0.65 },
            0.15,
          )
            .fromTo(
              ".packing-flap-right",
              { rotation: 18, svgOrigin: "70 40" },
              { rotation: 0, duration: 0.65 },
              0.25,
            )
            .fromTo(
              ".packing-seal",
              { scaleY: 0, svgOrigin: "48 32" },
              { scaleY: 1, duration: 0.55 },
              0.65,
            );
        } else if (stage === 3) {
          tl.fromTo(
            ".transport-body",
            { x: -9 },
            { x: 0, duration: 1.1, ease: "sine.inOut" },
            0.1,
          )
            .fromTo(
              ".wheel-front",
              { rotation: -160, svgOrigin: "72 70" },
              { rotation: 0, duration: 1.1 },
              0.1,
            )
            .fromTo(
              ".wheel-back",
              { rotation: -160, svgOrigin: "32 70" },
              { rotation: 0, duration: 1.1 },
              0.1,
            )
            .fromTo(
              ".speed-traces",
              { x: 7, opacity: 0 },
              { x: -5, opacity: 1, duration: 0.7 },
              0.2,
            )
            .to(".speed-traces", { opacity: 0.35, duration: 0.3 }, 0.9);
        } else {
          tl.fromTo(".delivery-door", { y: 13 }, { y: 0, duration: 0.65 }, 0.15)
            .fromTo(
              ".delivery-cargo",
              { x: -13, opacity: 0.2 },
              { x: 0, opacity: 1, duration: 0.65 },
              0.5,
            )
            .fromTo(
              ".delivery-check",
              { scale: 0.6, opacity: 0, svgOrigin: "73 24" },
              { scale: 1, opacity: 1, duration: 0.45 },
              1,
            );
        }
        const observer = new IntersectionObserver(
          ([entry]) => {
            if (entry.isIntersecting && !document.hidden) {
              el.dataset.iconMotion = "playing";
              tl.play();
            } else tl.pause();
          },
          { threshold: 0.2 },
        );
        observer.observe(el);
        const visibility = () => {
          if (document.hidden) tl.pause();
          else {
            const r = el.getBoundingClientRect();
            if (r.bottom > 0 && r.top < innerHeight) tl.resume();
          }
        };
        document.addEventListener("visibilitychange", visibility);
        revert = () => {
          observer.disconnect();
          document.removeEventListener("visibilitychange", visibility);
          ctx.revert();
          const marker = el.querySelector(".route-probe");
          marker?.setAttribute("cx", "76");
          marker?.setAttribute("cy", "26");
          delete el.dataset.iconMotion;
        };
      }, el);
    };
    void begin();
    media.addEventListener("change", begin);
    return () => {
      disposed = true;
      revision++;
      media.removeEventListener("change", begin);
      revert?.();
    };
  }, [stage]);

  return (
    <div
      ref={root}
      className="journey-stage-visual"
      data-journey-icon={stage}
      data-icon-name={names[stage]}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 96 96"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path
          className="icon-register"
          d="M5 25V9h16M75 9h16v16M91 71v16H75M21 87H5V71"
        />
        <g className="icon-drawing" key={stage}>
          {stage === 0 && (
            <>
              <path
                className="stage-ink"
                d="M24 19h34l13 13v45H24zM57 19v15h14M32 66h12M32 71h22"
              />
              <path
                className="stage-ink"
                d="M33 45l14-8 14 8v14l-14 8-14-8zM33 45l14 8 14-8M47 53v14"
              />
              <path className="icon-accent inspection-scan" d="M17 45h61" />
              <path className="icon-accent stage-ink" d="M76 53v13M70 59h12" />
            </>
          )}
          {stage === 1 && (
            <>
              <path
                className="stage-ink"
                d="M19 74V43l29 15 29-15V15L48 30 19 15v16M48 30v49"
              />
              <path
                className="planned-route stage-ink icon-accent"
                d="M20 68C45 68 28 37 48 42S62 27 76 26"
              />
              <circle cx="20" cy="68" r="4" />
              <circle
                className="destination-ring icon-accent"
                cx="76"
                cy="26"
                r="8"
              />
              <circle
                className="route-probe icon-accent"
                cx="76"
                cy="26"
                r="3"
                fill="currentColor"
              />
            </>
          )}
          {stage === 2 && (
            <>
              <path
                className="stage-ink"
                d="M26 40l22 12 22-12v31L48 83 26 71zM48 52v31"
              />
              <path
                className="packing-flap-left stage-ink"
                d="M26 40L14 29l22-12 12 15z"
              />
              <path
                className="packing-flap-right stage-ink"
                d="M70 40l12-11-22-12-12 15z"
              />
              <path
                className="packing-seal icon-accent"
                d="M48 32v20M44 54v21M52 54v21"
              />
              <path className="stage-ink icon-accent" d="M64 79l5 5 13-14" />
            </>
          )}
          {stage === 3 && (
            <>
              <path
                className="speed-traces icon-accent"
                d="M8 40h12M5 49h11M9 58h11"
              />
              <g className="transport-body">
                <path
                  className="stage-ink"
                  d="M23 29h37v36H23zM60 41h13l13 14v10H60M64 45h7l9 10H64M20 65h69"
                />
                <path className="stage-ink" d="M31 35v21M39 35v21M47 35v21" />
                <g className="wheel-back">
                  <circle cx="32" cy="70" r="7" />
                  <path d="M32 66v8M28 70h8" />
                </g>
                <g className="wheel-front">
                  <circle cx="72" cy="70" r="7" />
                  <path d="M72 66v8M68 70h8" />
                </g>
              </g>
            </>
          )}
          {stage === 4 && (
            <>
              <path
                className="stage-ink"
                d="M17 78V38L45 21l27 17v40M12 78h67M28 78V46h32v32"
              />
              <path className="delivery-door" d="M30 49h28M30 54h28M30 59h28" />
              <g className="delivery-cargo icon-accent">
                <path d="M34 66l10-6 10 6v13l-10 6-10-6zM34 66l10 6 10-6M44 72v13" />
              </g>
              <g className="delivery-check icon-accent">
                <circle cx="73" cy="24" r="12" />
                <path d="M67 24l4 4 8-9" />
              </g>
            </>
          )}
        </g>
      </svg>
      <span className="mono">
        0{stage + 1} /{" "}
        {["INSPECT", "ROUTE", "PACK", "TRANSPORT", "HANDOVER"][stage]}
      </span>
    </div>
  );
}
