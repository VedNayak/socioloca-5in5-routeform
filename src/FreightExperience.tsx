import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowDown, ArrowUpRight, Pause, Play, X } from "lucide-react";
import type { FreightRenderer } from "./freight/renderer";

const homeChapters = [
  {
    label: "The cargo",
    lines: ["Commerce,", "in motion."],
    text: "Cargo first. Every handover considered. Explore a connected system for freight, storage and the details in between.",
  },
  {
    label: "The detail",
    lines: ["Inside the", "movement."],
    text: "Planning. Packing. Documentation. Consider the details that connect one stage with the next.",
  },
  {
    label: "The handovers",
    lines: ["One journey.", "Many handovers."],
    text: "Transport is one part of the story. Bringing the services around it together makes the whole movement clearer.",
  },
  {
    label: "The connections",
    lines: ["Across borders.", "Within reach."],
    text: "See a possible journey across the world. Cities and lanes illustrate a network, not real offices or live shipments.",
  },
];
const chapterPositions = [0, 0.38, 0.57, 0.9];

type Opening = {
  label: string;
  lines: string[];
  text: string;
  destination: string;
  action: string;
};
export default function FreightExperience({ opening }: { opening?: Opening }) {
  const chapters = opening
    ? [
        { label: "The cargo", lines: opening.lines, text: opening.text },
        {
          label: "The detail",
          lines: ["Consider every", "detail."],
          text: "Cargo, timing, handling and documents. A clearer brief helps shape the next movement.",
        },
        {
          label: "The handovers",
          lines: ["Connect the", "whole journey."],
          text: "Explore a connected freight system with original cargo studies and illustrative planning scenarios below.",
        },
        homeChapters[3],
      ]
    : homeChapters;
  const section = useRef<HTMLElement>(null),
    host = useRef<HTMLDivElement>(null),
    video = useRef<HTMLVideoElement>(null),
    engine = useRef<FreightRenderer | undefined>(undefined);
  const range = useRef({ start: 0, end: 0 });
  const entryPositioned = useRef(false);
  const activateScene = useRef<(() => void) | undefined>(undefined);
  const [mode, setMode] = useState<"static" | "mobile" | "desktop">("static");
  const [enhanced, setEnhanced] = useState(false),
    [ready, setReady] = useState(false),
    [active, setActive] = useState(0),
    [paused, setPaused] = useState(false),
    [location, setLocation] = useState<string>();

  useEffect(() => {
    const motion = matchMedia("(prefers-reduced-motion: reduce)"),
      mobile = matchMedia("(max-width: 820px)");
    const decide = () =>
      setMode(
        motion.matches ? "static" : mobile.matches ? "mobile" : "desktop",
      );
    decide();
    motion.addEventListener("change", decide);
    mobile.addEventListener("change", decide);
    return () => {
      motion.removeEventListener("change", decide);
      mobile.removeEventListener("change", decide);
    };
  }, []);

  useEffect(() => {
    if (mode === "static") {
      setEnhanced(false);
      setReady(false);
      return;
    }
    const el = section.current,
      target = host.current;
    if (!el || !target) return;
    const probe = document.createElement("canvas");
    let context: WebGL2RenderingContext | null = null;
    let cancelled = false,
      removeAnimation: (() => void) | undefined;
    setEnhanced(true);
    setReady(false);
    setActive(0);
    setLocation(undefined);
    range.current = { start: 0, end: 0 };
    const start = async () => {
      context = probe.getContext("webgl2", {
        alpha: true,
        antialias: mode === "desktop",
        powerPreference: mode === "desktop" ? "high-performance" : "low-power",
      });
      if (!context) {
        setEnhanced(false);
        setReady(false);
        return;
      }
      try {
        const [{ createFreightRenderer }, { gsap }, { ScrollTrigger }] =
          await Promise.all([
            import("./freight/renderer"),
            import("gsap"),
            import("gsap/ScrollTrigger"),
          ]);
        if (cancelled) {
          context.getExtension("WEBGL_lose_context")?.loseContext();
          return;
        }
        gsap.registerPlugin(ScrollTrigger);
        const controller = await createFreightRenderer(target, {
          canvas: probe,
          context,
          poster: el.querySelector<HTMLImageElement>(".cinema-poster img")!,
          onReady: () => {
            if (!cancelled) setReady(true);
          },
          onError: () => {
            if (!cancelled) {
              removeAnimation?.();
              removeAnimation = undefined;
              setEnhanced(false);
              setReady(false);
              engine.current?.dispose();
              engine.current = undefined;
            }
          },
          onNodes: (nodes) => {
            for (const node of nodes) {
              const label = el.querySelector<HTMLElement>(
                `[data-city="${node.id}"]`,
              );
              if (label)
                label.style.transform = `translate3d(${Math.max(12, Math.min(node.x, target.clientWidth - 125))}px,${Math.max(110, Math.min(node.y, target.clientHeight - 165))}px,0)`;
            }
          },
        });
        if (cancelled) {
          controller.dispose();
          return;
        }
        engine.current = controller;
        if (video.current?.readyState && video.current.readyState >= 2)
          controller.video(video.current);
        const director = { progress: 0 };
        let currentChapter = -1;
        const ctx = gsap.context(() => {
          const copies = gsap.utils.toArray<HTMLElement>(".cinema-copy", el);
          const timeline = gsap.timeline({
            scrollTrigger: {
              trigger: el,
              start: mode === "mobile" ? "top 96px" : "top top",
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
                controller.progress(director.progress);
                el.style.setProperty(
                  "--cinema-progress",
                  String(director.progress),
                );
                el.dataset.progress = director.progress.toFixed(3);
                const next =
                  director.progress < 0.22
                    ? 0
                    : director.progress < 0.46
                      ? 1
                      : director.progress < 0.73
                        ? 2
                        : 3;
                if (next !== currentChapter) {
                  currentChapter = next;
                  setActive(next);
                }
              },
            },
            0,
          );
          copies.forEach((copy, index) => {
            const words = copy.querySelectorAll(".cinema-word");
            if (index === 0) {
              timeline.to(
                words,
                {
                  yPercent: -118,
                  duration: 0.065,
                  stagger: 0.004,
                  ease: "power2.in",
                },
                0.15,
              );
              timeline.to(copy, { autoAlpha: 0, duration: 0.025 }, 0.21);
            } else {
              const begin = [0, 0.3, 0.48, 0.76][index];
              gsap.set(copy, { autoAlpha: 0 });
              timeline.to(copy, { autoAlpha: 1, duration: 0.025 }, begin);
              timeline.fromTo(
                words,
                { yPercent: 118, rotation: 4 },
                {
                  yPercent: 0,
                  rotation: 0,
                  duration: index === 1 ? 0.05 : 0.068,
                  stagger: index === 1 ? 0.003 : 0.004,
                  ease: "power3.out",
                },
                begin,
              );
              if (index < 3) {
                const finish = [0, 0.42, 0.67][index];
                timeline.to(
                  words,
                  {
                    yPercent: -118,
                    duration: 0.055,
                    stagger: 0.002,
                    ease: "power2.in",
                  },
                  finish,
                );
                timeline.to(
                  copy,
                  { autoAlpha: 0, duration: 0.028 },
                  finish + 0.045,
                );
              }
            }
          });
          gsap.to(".cinema-corner", {
            rotation: 90,
            scale: 0.72,
            duration: 1,
            ease: "none",
            scrollTrigger: {
              trigger: el,
              start: "top top",
              end: "bottom bottom",
              scrub: 0.65,
            },
          });
          ScrollTrigger.refresh();
        }, el);
        removeAnimation = () => ctx.revert();
      } catch (error) {
        if (!cancelled) {
          setEnhanced(false);
          setReady(false);
          target.querySelector("canvas")?.remove();
        }
        console.warn(
          "The visual story is using its static fallback.",
          error instanceof Error ? error.message : "",
        );
      }
    };
    // The opening film is useful immediately. Prepare the interactive scene
    // when a visitor explores it, rather than blocking navigation on arrival.
    let launched = false,
      inputObserved = false;
    const activate = (event?: Event) => {
      if (cancelled || launched || !el.isConnected) return;
      if (event?.type === "scroll" && !inputObserved) return;
      if (["scroll", "wheel", "keydown"].includes(event?.type ?? "")) {
        const bounds = el.getBoundingClientRect();
        if (bounds.bottom <= 0 || bounds.top >= innerHeight) return;
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
        (event.target as Element)?.closest("a, .cinema-pause")
      )
        return;
      launched = true;
      removeIntent();
      void start();
    };
    const input = (event: Event) => {
      inputObserved = true;
      activate(event);
    };
    const markPointer = () => {
      inputObserved = true;
    };
    const removeIntent = () => {
      window.removeEventListener("scroll", activate);
      window.removeEventListener("wheel", input);
      window.removeEventListener("keydown", input);
      window.removeEventListener("pointerdown", markPointer);
      el.removeEventListener("pointerdown", input);
    };
    activateScene.current = () => activate();
    window.addEventListener("scroll", activate, { passive: true });
    window.addEventListener("wheel", input, { passive: true });
    window.addEventListener("keydown", input, { passive: true });
    window.addEventListener("pointerdown", markPointer, { passive: true });
    el.addEventListener("pointerdown", input, { passive: true });
    return () => {
      cancelled = true;
      removeIntent();
      activateScene.current = undefined;
      removeAnimation?.();
      if (engine.current) engine.current.dispose();
      else context?.getExtension("WEBGL_lose_context")?.loseContext();
      engine.current = undefined;
      setReady(false);
    };
  }, [mode]);

  useEffect(() => {
    if (entryPositioned.current) return;
    if (!enhanced) {
      if (matchMedia("(prefers-reduced-motion: reduce)").matches)
        entryPositioned.current = true;
      return;
    }
    entryPositioned.current = true;
    const target = document.getElementById(window.location.hash.slice(1));
    if (!target || section.current?.contains(target)) return;
    // Reconcile a direct anchor after hydration establishes the cinematic range.
    const frame = requestAnimationFrame(() =>
      target.scrollIntoView({ behavior: "instant", block: "start" }),
    );
    return () => cancelAnimationFrame(frame);
  }, [enhanced]);

  useEffect(() => {
    engine.current?.pause(paused);
    const clip = video.current;
    if (!clip) return;
    if (enhanced && mode === "desktop" && active === 0 && !paused)
      clip.play().catch(() => {});
    else clip.pause();
  }, [paused, ready, enhanced, mode, active]);

  const jump = (index: number) => {
    activateScene.current?.();
    const el = section.current;
    if (!el) return;
    if (enhanced) {
      const top = el.getBoundingClientRect().top + window.scrollY;
      const start =
        range.current.end > range.current.start
          ? range.current.start
          : top - (mode === "mobile" ? 96 : 0);
      const end =
        range.current.end > range.current.start
          ? range.current.end
          : top + el.offsetHeight - innerHeight;
      window.scrollTo({
        top: start + (end - start) * chapterPositions[index],
        behavior: "smooth",
      });
    } else
      el.querySelector(`#cargo-chapter-${index}`)?.scrollIntoView({
        behavior: mode === "static" ? "instant" : "smooth",
        block: "start",
      });
  };

  return (
    <section
      id="movement"
      ref={section}
      className={`hero freight-experience ${opening ? "interior-cinema" : ""} ${enhanced ? "cinema-enhanced" : "cinema-static"} ${ready ? "gpu-ready" : ""}`}
      data-phase={active}
      data-render-mode={ready ? "webgl" : "static"}
      aria-label="From cargo to connections"
    >
      <div className="cinema-frame">
        <picture className="cinema-poster hero-image">
          <source
            media="(max-width: 820px)"
            type="image/avif"
            srcSet="/images/cargo-cinema-mobile.avif"
          />
          <source
            media="(max-width: 820px)"
            srcSet="/images/cargo-cinema-mobile.webp"
          />
          <source type="image/avif" srcSet="/images/cargo-cinema.avif" />
          <img
            src="/images/cargo-cinema.webp"
            alt="Illustrative hyperrealistic orange cargo container suspended from a lifting frame at a port"
            width={1536}
            height={1024}
            fetchPriority="high"
          />
        </picture>
        <div className="cinema-webgl" ref={host} />
        <video
          ref={video}
          className="cinema-film"
          src={
            enhanced && mode === "desktop"
              ? "/images/cargo-cinema.mp4"
              : undefined
          }
          muted
          loop
          playsInline
          preload="none"
          aria-hidden="true"
          onLoadedData={(event) => engine.current?.video(event.currentTarget)}
        />
        <div className="cinema-grain" aria-hidden="true" />
        {chapters.map((chapter, index) => {
          const Heading = index === 0 ? "h1" : "h2";
          return (
            <article
              key={chapter.label}
              id={`cargo-chapter-${index}`}
              className={`cinema-copy cinema-copy-${index}`}
              aria-hidden={enhanced && active !== index}
              inert={enhanced && active !== index}
            >
              <span className="eyebrow">
                <span className="cinema-status" />{" "}
                {index === 0
                  ? (opening?.label ?? "DUBAI FOUNDATION / GLOBAL OUTLOOK")
                  : `0${index + 1} / ${chapter.label.toUpperCase()}`}
              </span>
              <Heading aria-label={chapter.lines.join(" ")}>
                {chapter.lines.map((line) => (
                  <span className="cinema-line" key={line}>
                    {line.split(" ").map((word, n) => (
                      <span
                        className="cinema-word"
                        aria-hidden="true"
                        key={word + String(n)}
                      >
                        {word}
                        {n < line.split(" ").length - 1 ? "\u00a0" : ""}
                      </span>
                    ))}
                  </span>
                ))}
              </Heading>
              <p>{chapter.text}</p>
              {index === 0 ? (
                <div className="cinema-actions">
                  {opening ? (
                    <a href={opening.destination} className="button">
                      {opening.action} <ArrowUpRight size={18} />
                    </a>
                  ) : (
                    <Link to="/services" className="button">
                      Explore services <ArrowUpRight size={18} />
                    </Link>
                  )}
                  <Link to="/quote" className="inline-link">
                    Plan your shipment <ArrowUpRight size={17} />
                  </Link>
                </div>
              ) : (
                <Link
                  to={index === 3 ? "/about" : "/services"}
                  className="inline-link"
                >
                  {index === 3
                    ? "Explore the illustrative network"
                    : "Explore the services"}{" "}
                  <ArrowUpRight size={17} />
                </Link>
              )}
              {!enhanced && index > 0 && (
                <div className="cinema-static-diagram" aria-hidden="true">
                  {index === 3 ? (
                    <img
                      src="/images/world-map.svg"
                      width={1130}
                      height={570}
                      alt=""
                    />
                  ) : (
                    <svg viewBox="0 0 600 240">
                      <path
                        d="M80 55L420 15 550 70 210 120Z M80 55V170L210 220 550 165V70 M210 120V220 M105 70V180 M135 80V190 M165 90V200 M260 112V213 M310 105V205 M360 97V196 M410 90V188 M460 82V180 M510 76V172"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      />
                    </svg>
                  )}
                </div>
              )}
            </article>
          );
        })}
        {enhanced && (
          <div
            className={`cinema-locations ${active === 3 ? "locations-visible" : ""}`}
            aria-hidden={active !== 3}
            inert={active !== 3}
          >
            <button
              data-city="dubai"
              aria-label="DXB Dubai — illustrative node"
              onClick={() => setLocation("dubai")}
              aria-expanded={location === "dubai"}
            >
              <span className="city-cross" />
              DXB <span>DUBAI</span>
            </button>
            <button
              data-city="hong-kong"
              aria-label="HKG Hong Kong — illustrative node"
              onClick={() => setLocation("hong-kong")}
              aria-expanded={location === "hong-kong"}
            >
              <span className="city-cross" />
              HKG <span>HONG KONG</span>
            </button>
          </div>
        )}
        {location && active === 3 && enhanced && (
          <aside
            className="cinema-location-card"
            aria-label="Illustrative network node"
          >
            <button
              aria-label="Close location detail"
              onClick={() => setLocation(undefined)}
            >
              <X size={16} />
            </button>
            <span className="eyebrow">ILLUSTRATIVE NODE</span>
            <h3>{location === "dubai" ? "Dubai, UAE" : "Hong Kong"}</h3>
            <p>
              {location === "dubai"
                ? "Illustrative interchange between sea, air and regional road transport. No real Routeform office or facility is implied."
                : "Illustrative origin for an electronics shipment connecting air cargo with ground handling. No real operation is implied."}
            </p>
            <Link to="/about" className="inline-link">
              Explore the operating model <ArrowUpRight size={15} />
            </Link>
          </aside>
        )}
        <svg className="cinema-corner" viewBox="0 0 80 80" aria-hidden="true">
          <path
            d="M8 32V8H32 M48 8H72V32 M72 48V72H48 M32 72H8V48"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
          />
        </svg>
        <div className="cinema-controls">
          <span className="mono cinema-scroll">
            <ArrowDown size={14} />
            {enhanced ? "SCROLL TO TRANSFORM" : "FROM CARGO TO CONNECTIONS"}
          </span>
          <div
            className="cinema-chapters"
            role="group"
            aria-label="Visual story chapters"
          >
            {chapters.map((chapter, index) => (
              <button
                key={chapter.label}
                aria-label={`Scene ${index + 1}: ${chapter.label}`}
                aria-pressed={enhanced && active === index}
                onClick={() => jump(index)}
              >
                <span className="chapter-number">0{index + 1}</span>
                <span>{chapter.label}</span>
              </button>
            ))}
          </div>
          {enhanced && (
            <button
              className="cinema-pause"
              aria-label={paused ? "Resume scene motion" : "Pause scene motion"}
              onClick={() => setPaused(!paused)}
            >
              {paused ? <Play size={15} /> : <Pause size={15} />}
            </button>
          )}
          <a href={opening?.destination ?? "#intro"} className="cinema-skip">
            {opening?.action ?? "Continue to services"} <ArrowDown size={13} />
          </a>
        </div>
        <div className="cinema-disclosure mono">
          ILLUSTRATIVE VISUAL STORY / NOT LIVE SHIPMENT DATA
        </div>
      </div>
    </section>
  );
}
