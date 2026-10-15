import { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUpRight, Pause, Play } from "lucide-react";
import type { OpeningKind, OpeningRenderer } from "./freight/opening-renderer";
const stories = {
  services: {
    action: "Explore services",
    stage: ["On the apron", "The flight plan", "Beyond one mode"],
    title: ["A considered route", "for every cargo."],
    detail: ["From cargo to capability.", "Air. Ocean. Land. Connected."],
    copy: [
      "Mode selection starts with the cargo, the route and the required handling.",
      "Explore transport, storage and the details that connect them below.",
    ],
    labels: [
      "AIR / TIME-SENSITIVE",
      "OCEAN / VOLUME",
      "LAND / ONWARD MOVEMENT",
    ],
  },
  industries: {
    action: "Explore solutions",
    stage: ["On the floor", "At work", "At every handover"],
    title: ["Built around", "what you move."],
    detail: ["The cargo sets the conditions.", "See the whole supply chain."],
    copy: [
      "Packing, access, handling and storage all shape the shipment plan.",
      "Follow illustrative cargo scenarios and explore the decisions at each stage.",
    ],
    labels: ["PREPARE", "HANDLE", "CONNECT"],
  },
  about: {
    action: "Meet Routeform",
    stage: ["At the harbor", "A considered foundation", "A connected outlook"],
    title: ["Built around cargo.", "Connected by design."],
    detail: ["Built on freight.", "One cargo brief. Every handover."],
    copy: [
      "A cargo-first way to think about transport, storage and documentation.",
      "Every route starts with a requirement. Explore the operating philosophy behind this fictional brand.",
    ],
    labels: ["ORIGIN / PREPARE", "DESTINATION / CONNECT"],
  },
  quote: {
    action: "Start your brief",
    stage: ["Your cargo", "The dimensions", "The next detail"],
    title: ["Let’s get your", "cargo moving."],
    detail: ["Start with what you know.", "A clear brief. A considered plan."],
    copy: [
      "Weight, package count and dimensions inform the shipment discussion.",
      "Prepare a local demonstration brief. No enquiry is transmitted.",
    ],
    labels: ["DIMENSIONS", "GROSS WEIGHT", "READY DATE"],
  },
};
const chapterPositions = [0, 0.38, 0.9];
/** Scroll to a chapter using ScrollTrigger's measured range when known. */
function scrollToChapter(
  el: HTMLElement | null,
  range: { start: number; end: number },
  mode: "static" | "mobile" | "desktop",
  index: number,
) {
  if (!el) return;
  const top = el.getBoundingClientRect().top + scrollY,
    known = range.end > range.start;
  const start = known ? range.start : top - (mode === "mobile" ? 100 : 0),
    end = known ? range.end : top + el.offsetHeight - innerHeight;
  window.scrollTo({
    top: start + (end - start) * chapterPositions[index],
    behavior: mode === "static" ? "instant" : "smooth",
  });
}
/** Shared graphics plumbing; each route has its own composition, subject, pacing and narrative.
 * Scroll drives the same scrubbed timeline and phase timings as Home's cargo story. */
export default function PageOpening({
  kind,
  label,
  lines,
  text,
}: {
  kind: OpeningKind;
  label: string;
  lines: string[];
  text: string;
}) {
  const root = useRef<HTMLElement>(null),
    host = useRef<HTMLDivElement>(null),
    photo = useRef<HTMLImageElement>(null),
    video = useRef<HTMLVideoElement>(null),
    engine = useRef<OpeningRenderer | undefined>(undefined);
  const [mode, setMode] = useState<"static" | "mobile" | "desktop">("static");
  const [phase, setPhase] = useState(0),
    [paused, setPaused] = useState(false),
    [ready, setReady] = useState(false),
    [scrubbed, setScrubbed] = useState(false),
    [failed, setFailed] = useState(false);
  const enhanced = mode !== "static",
    desktop = mode === "desktop";
  const pauseRef = useRef(false),
    progress = useRef(0),
    range = useRef({ start: 0, end: 0 }),
    activate = useRef<(() => void) | undefined>(undefined),
    // A chapter chosen before the timeline exists waits for its scroll range;
    // ScrollTrigger's first refresh would otherwise cancel a smooth scroll.
    pendingJump = useRef<number | undefined>(undefined),
    scrubbing = useRef(false),
    // Hydration grows the opening; until a deep link is re-positioned, its
    // scroll events are layout settling, not a visitor exploring the scene.
    settling = useRef(false);
  const story = stories[kind],
    destination = kind === "quote" ? "#quote-start" : "#intro";
  useEffect(() => {
    const reduce = matchMedia("(prefers-reduced-motion: reduce)"),
      mobile = matchMedia("(max-width: 820px)");
    const decide = () =>
      setMode(
        reduce.matches ? "static" : mobile.matches ? "mobile" : "desktop",
      );
    decide();
    reduce.addEventListener("change", decide);
    mobile.addEventListener("change", decide);
    return () => {
      reduce.removeEventListener("change", decide);
      mobile.removeEventListener("change", decide);
    };
  }, []);
  useEffect(() => {
    const target = window.location.hash.slice(1);
    if (!enhanced || !target || target === "page-opening") return;
    let alive = true,
      frame = 0;
    settling.current = true;
    void document.fonts.ready.then(() => {
      frame = requestAnimationFrame(() => {
        if (!alive) return;
        document
          .getElementById(target)
          ?.scrollIntoView({ behavior: "instant" });
        frame = requestAnimationFrame(() => (settling.current = false));
      });
    });
    return () => {
      alive = false;
      settling.current = false;
      cancelAnimationFrame(frame);
    };
  }, [enhanced, kind]);
  useEffect(() => {
    const el = root.current,
      target = host.current,
      image = photo.current;
    if (!el || !target || !image || mode === "static") {
      setReady(false);
      setPhase(0);
      return;
    }
    let cancelled = false,
      inView = true,
      launched = false,
      removeTimeline: (() => void) | undefined;
    const clip = video.current;
    setReady(false);
    setFailed(false);
    setPhase(0);
    progress.current = 0;
    range.current = { start: 0, end: 0 };
    el.style.setProperty("--opening-media", "1");
    const film = () => {
      if (!clip) return;
      if (
        progress.current < 0.14 &&
        inView &&
        !pauseRef.current &&
        !document.hidden
      )
        void clip.play().catch(() => {});
      else clip.pause();
    };
    const fail = () => {
      if (cancelled) return;
      setFailed(true);
      setReady(false);
      engine.current?.dispose();
      engine.current = undefined;
      el.style.setProperty("--opening-media", "1");
    };
    const start = async () => {
      try {
        const [{ gsap }, { ScrollTrigger }, { createOpeningRenderer }] =
          await Promise.all([
            import("gsap"),
            import("gsap/ScrollTrigger"),
            import("./freight/opening-renderer"),
          ]);
        if (cancelled) return;
        gsap.registerPlugin(ScrollTrigger);
        let current = -1;
        const director = { progress: 0 };
        const ctx = gsap.context(() => {
          const copies = gsap.utils.toArray<HTMLElement>(".opening-copy", el);
          const words = (copy: HTMLElement) =>
            copy.querySelectorAll(".opening-word");
          const timeline = gsap.timeline({
            scrollTrigger: {
              trigger: el,
              start: mode === "mobile" ? "top 100px" : "top top",
              end: "bottom bottom",
              scrub: 0.55,
              invalidateOnRefresh: true,
              onRefresh: (self) => {
                range.current = { start: self.start, end: self.end };
              },
            },
          });
          timeline.to(
            director,
            {
              progress: 1,
              duration: 1,
              ease: "none",
              onUpdate: () => {
                const p = director.progress;
                progress.current = p;
                engine.current?.update(p);
                el.style.setProperty("--opening-progress", String(p));
                el.dataset.progress = p.toFixed(3);
                film();
                const next = p < 0.255 ? 0 : p < 0.68 ? 1 : 2;
                if (next !== current) {
                  current = next;
                  setPhase(next);
                }
              },
            },
            0,
          );
          // Home's masked word choreography and timings. Explicit start
          // values keep reversal exact even after a direct chapter jump.
          const later = { immediateRender: false };
          timeline.fromTo(
            words(copies[0]),
            { yPercent: 0 },
            {
              yPercent: -118,
              duration: 0.065,
              stagger: 0.004,
              ease: "power2.in",
              ...later,
            },
            0.15,
          );
          timeline.fromTo(
            copies[0],
            { autoAlpha: 1 },
            { autoAlpha: 0, duration: 0.025, ...later },
            0.21,
          );
          [0.3, 0.76].forEach((begin, i) => {
            const copy = copies[i + 1];
            gsap.set(copy, { autoAlpha: 0 });
            timeline.fromTo(
              copy,
              { autoAlpha: 0 },
              { autoAlpha: 1, duration: 0.025, ...later },
              begin,
            );
            timeline.fromTo(
              words(copy),
              { yPercent: 118, rotation: 4 },
              {
                yPercent: 0,
                rotation: 0,
                duration: i ? 0.068 : 0.05,
                stagger: i ? 0.004 : 0.003,
                ease: "power3.out",
              },
              begin,
            );
            if (i) return;
            timeline.fromTo(
              words(copy),
              { yPercent: 0, rotation: 0 },
              {
                yPercent: -118,
                duration: 0.055,
                stagger: 0.002,
                ease: "power2.in",
                ...later,
              },
              0.6,
            );
            timeline.fromTo(
              copy,
              { autoAlpha: 1 },
              { autoAlpha: 0, duration: 0.028, ...later },
              0.645,
            );
          });
          ScrollTrigger.refresh();
        }, el);
        scrubbing.current = true;
        setScrubbed(true);
        removeTimeline = () => {
          scrubbing.current = false;
          setScrubbed(false);
          ctx.revert();
        };
        if (pendingJump.current !== undefined) {
          scrollToChapter(el, range.current, mode, pendingJump.current);
          pendingJump.current = undefined;
        }
        try {
          if (!image.complete) await image.decode();
          if (cancelled) return;
          const renderer = await createOpeningRenderer(
            target,
            kind,
            image,
            clip,
            {
              onReady: () => {
                if (cancelled) return;
                el.style.setProperty("--opening-media", "0");
                setReady(true);
              },
              onError: fail,
            },
          );
          if (cancelled) {
            renderer.dispose();
            return;
          }
          engine.current = renderer;
          renderer.update(progress.current);
          renderer.pause(pauseRef.current);
          renderer.visible(inView);
        } catch (error) {
          fail();
          console.warn(
            "The opening is using its static view.",
            error instanceof Error ? error.message : "",
          );
        }
      } catch {
        // Without the motion libraries the opening remains a readable still.
        if (pendingJump.current !== undefined)
          scrollToChapter(el, range.current, mode, pendingJump.current);
        pendingJump.current = undefined;
      }
    };
    // As on Home, the film and copy are useful immediately; graphics and
    // scroll choreography load when a visitor starts to explore the opening.
    const launch = (event?: Event) => {
      if (cancelled || launched || !el.isConnected) return;
      if (event && event.type !== "pointerdown") {
        const bounds = el.getBoundingClientRect(),
          middle = innerHeight / 2;
        if (settling.current || bounds.bottom < middle || bounds.top > middle)
          return;
      }
      if (
        event?.type === "keydown" &&
        !["ArrowDown", "PageDown", " ", "End"].includes(
          (event as KeyboardEvent).key,
        )
      )
        return;
      if (
        event?.type === "pointerdown" &&
        (event.target as Element)?.closest("a, .opening-pause")
      )
        return;
      launched = true;
      removeIntent();
      void start();
    };
    const input = (event: Event) => launch(event);
    const removeIntent = () => {
      window.removeEventListener("scroll", launch);
      window.removeEventListener("wheel", input);
      window.removeEventListener("touchmove", input);
      window.removeEventListener("keydown", input);
      el.removeEventListener("pointerdown", input);
    };
    activate.current = () => launch();
    window.addEventListener("scroll", launch, { passive: true });
    window.addEventListener("wheel", input, { passive: true });
    window.addEventListener("touchmove", input, { passive: true });
    window.addEventListener("keydown", input, { passive: true });
    el.addEventListener("pointerdown", input, { passive: true });
    const observer = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      engine.current?.visible(inView);
      film();
    });
    observer.observe(el);
    document.addEventListener("visibilitychange", film);
    film();
    return () => {
      cancelled = true;
      removeIntent();
      activate.current = undefined;
      observer.disconnect();
      document.removeEventListener("visibilitychange", film);
      removeTimeline?.();
      engine.current?.dispose();
      engine.current = undefined;
      clip?.pause();
      el.style.setProperty("--opening-media", "1");
    };
  }, [mode, kind]);
  useEffect(() => {
    pauseRef.current = paused;
    engine.current?.pause(paused);
    const clip = video.current;
    if (!clip) return;
    if (paused || progress.current >= 0.14) clip.pause();
    else if (desktop) void clip.play().catch(() => {});
  }, [paused, desktop, ready]);
  function jump(index: number) {
    if (!scrubbing.current && mode !== "static") {
      pendingJump.current = index;
      activate.current?.();
      return;
    }
    scrollToChapter(root.current, range.current, mode, index);
  }
  function toggle() {
    setPaused(!paused);
  }
  return (
    <section
      ref={root}
      id="page-opening"
      className={`page-opening opening-${kind} ${enhanced ? "opening-enhanced" : ""} ${ready ? "opening-ready" : ""} ${scrubbed ? "opening-scrubbed" : ""}`}
      data-opening={kind}
      data-phase={phase}
      data-ready={ready}
    >
      <div className="opening-frame">
        <picture className="opening-picture">
          <source
            media="(max-width:820px)"
            srcSet={`/images/opening-v6-${kind}-mobile.avif`}
            type="image/avif"
          />
          <source
            media="(max-width:820px)"
            srcSet={`/images/opening-v6-${kind}-mobile.webp`}
            type="image/webp"
          />
          <source
            srcSet={`/images/opening-v6-${kind}.avif`}
            type="image/avif"
          />
          <img
            ref={photo}
            src={`/images/opening-v6-${kind}.webp`}
            width="1672"
            height="941"
            alt={`Illustrative ${kind === "services" ? "cargo aircraft on an airport apron" : kind === "industries" ? "forklift handling a pallet in a warehouse" : kind === "about" ? "container ship at blue hour" : "shipping crate and pallet in a studio"}`}
            fetchPriority="high"
            decoding="async"
          />
        </picture>
        {desktop && (
          <video
            ref={video}
            className="opening-film"
            src={`/images/opening-v6-${kind}.mp4`}
            muted
            loop
            playsInline
            preload="none"
            aria-hidden="true"
            onLoadedData={(e) => e.currentTarget.classList.add("film-ready")}
            onError={(e) => (e.currentTarget.style.display = "none")}
          />
        )}
        <div ref={host} className="opening-geometry" aria-hidden="true" />
        <div className="opening-shade" aria-hidden="true" />
        <div className="opening-rule" aria-hidden="true">
          <i />
        </div>
        <div
          className="opening-copy opening-first"
          data-active={phase === 0}
          aria-hidden={phase !== 0}
          inert={phase !== 0}
        >
          <span className="eyebrow">{label}</span>
          <h1 aria-label={lines.join(" ")}>
            {lines.map((line, i) => (
              <span className="opening-mask" key={line}>
                <span className="opening-word">
                  {line}
                  {i === lines.length - 1 && !line.endsWith(".") && (
                    <span className="orange">.</span>
                  )}
                </span>
              </span>
            ))}
          </h1>
          <p>{text}</p>
          <a
            href={destination}
            className="button"
            tabIndex={phase === 0 ? 0 : -1}
          >
            {story.action}
            <ArrowUpRight size={18} />
          </a>
        </div>
        {[1, 2].map((i) => (
          <div
            className={`opening-copy opening-later opening-copy-${i}`}
            key={i}
            data-active={phase === i}
            aria-hidden={phase !== i}
            inert={phase !== i}
          >
            <span className="eyebrow">
              {story.stage[i].toUpperCase()} / ILLUSTRATIVE STUDY
            </span>
            <h2 className="heading-lit" aria-label={story.detail[i - 1]}>
              <span className="opening-mask">
                <span className="opening-word">{story.detail[i - 1]}</span>
              </span>
            </h2>
            <p>{story.copy[i - 1]}</p>
            {i === 2 && (
              <>
                <div
                  className="opening-diagram-labels"
                  aria-label="Illustrative planning considerations"
                >
                  {story.labels.map((l) => (
                    <span className="mono" key={l}>
                      {l}
                    </span>
                  ))}
                </div>
                <a
                  href={destination}
                  className="inline-link"
                  tabIndex={phase === i ? 0 : -1}
                >
                  {story.action}
                  <ArrowDown size={16} />
                </a>
              </>
            )}
          </div>
        ))}
        <div className="opening-bottom">
          <span className="mono opening-scroll-cue">
            {enhanced && (
              <span className="opening-scroll-rail" aria-hidden="true" />
            )}
            {!enhanced || failed
              ? "ILLUSTRATIVE SCENE / STATIC VIEW"
              : phase === 2
                ? "CONTINUE SCROLLING ↓"
                : "SCROLL TO TRANSFORM ↓"}
          </span>
          <a href={destination} className="opening-skip">
            {story.action}
            <ArrowDown size={14} />
          </a>
        </div>
        {enhanced && (
          <div className="opening-controls">
            <div role="group" aria-label={`${kind} opening scenes`}>
              {story.stage.map((s, i) => (
                <button
                  key={s}
                  aria-label={`Explore ${s.toLowerCase()}`}
                  aria-pressed={phase === i}
                  onClick={() => jump(i)}
                >
                  <span className="mono">0{i + 1}</span>
                  <span>{s}</span>
                </button>
              ))}
            </div>
            <button
              className="opening-pause"
              aria-label={
                paused ? "Play opening motion" : "Pause opening motion"
              }
              aria-pressed={paused}
              onClick={toggle}
            >
              {paused ? <Play size={16} /> : <Pause size={16} />}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
