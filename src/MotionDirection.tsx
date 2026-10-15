import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/** Word masks and image shutters share the freight scene's motion language. */
export default function MotionDirection() {
  const location = useLocation();
  useEffect(() => {
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    let cancelled = false,
      cleanup: (() => void) | undefined,
      observer: IntersectionObserver | undefined,
      timer = 0,
      generation = 0;
    const begin = async () => {
      const run = ++generation;
      if (cancelled || media.matches) return;
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([
        import("gsap"),
        import("gsap/ScrollTrigger"),
      ]);
      if (cancelled || run !== generation || media.matches) return;
      gsap.registerPlugin(ScrollTrigger);
      const originals: {
        heading: HTMLElement;
        html: string;
        label: string | null;
      }[] = [];
      const ctx = gsap.context(() => {
        document.querySelectorAll<HTMLElement>(".map-shell").forEach((map) => {
          map.classList.add("reveal-ready");
          ScrollTrigger.create({
            trigger: map,
            start: "top 88%",
            once: true,
            onEnter: () => map.classList.add("in-view"),
          });
        });
        document
          .querySelectorAll<HTMLAnchorElement>(
            ".service-navigation nav a,.industry-jump a",
          )
          .forEach((link) => {
            const target = document.getElementById(link.hash.slice(1));
            if (target)
              ScrollTrigger.create({
                trigger: target,
                start: "top 50%",
                end: "bottom 50%",
                onToggle: (self) => {
                  if (self.isActive)
                    link.setAttribute("aria-current", "location");
                  else link.removeAttribute("aria-current");
                },
              });
          });
        document
          .querySelectorAll<HTMLElement>(".value-row,.service-detail ol li")
          .forEach((item) => {
            ScrollTrigger.create({
              trigger: item,
              start: "top 68%",
              end: "bottom 40%",
              onToggle: (self) => {
                item.dataset.scrollFocus = String(self.isActive);
              },
            });
          });
        const headings = document.querySelectorAll<HTMLElement>(
          ".page-intro h2,.quote-intro h2,.section-heading h2,.intro-text h2,.closing h2,.credibility h2,.service-editorial-title h2,.industry-story-head h2,.about-story h2,.philosophy h2,.operational-text h2,.cargo-measurements h2,.quote-next h2,.partnership h2,.locations h2,.faqs h2,.concept-disclosure h2",
        );
        headings.forEach((heading) => {
          // Do not hide content already passed during a fast anchor jump.
          if (heading.getBoundingClientRect().bottom < 100) return;
          originals.push({
            heading,
            html: heading.innerHTML,
            label: heading.getAttribute("aria-label"),
          });
          heading.setAttribute(
            "aria-label",
            heading.innerText.trim().replace(/\s+/g, " ") || "",
          );
          heading.classList.add("heading-lit");
          const walker = document.createTreeWalker(
            heading,
            NodeFilter.SHOW_TEXT,
          );
          const nodes: Text[] = [];
          while (walker.nextNode()) nodes.push(walker.currentNode as Text);
          for (const node of nodes) {
            if (!node.textContent?.trim()) continue;
            const fragment = document.createDocumentFragment();
            for (const word of node.textContent.split(/(\s+)/)) {
              if (!word.trim()) {
                fragment.append(document.createTextNode(word));
                continue;
              }
              const mask = document.createElement("span"),
                text = document.createElement("span");
              mask.className = "type-mask";
              mask.setAttribute("aria-hidden", "true");
              text.className = "type-word";
              text.textContent = word;
              mask.append(text);
              fragment.append(mask);
            }
            node.replaceWith(fragment);
          }
          const block =
            heading.closest<HTMLElement>(
              ".section-heading,.intro-text,.operational-text,.page-intro-main,.quote-intro,.service-editorial-title,.industry-story-head,.about-story > div,.philosophy > div,.closing,.cargo-measurements,.quote-next,.partnership > div,.faqs > div,.concept-disclosure",
            ) || heading;
          const words = Array.from(
            heading.querySelectorAll<HTMLElement>(".type-word"),
          );
          const bounds = heading.getBoundingClientRect();
          heading.style.setProperty("--heading-width", `${bounds.width}px`);
          words.forEach((word) =>
            word.style.setProperty(
              "--word-offset",
              `${word.getBoundingClientRect().left - bounds.left}px`,
            ),
          );
          const tops = words.map((word) =>
            Math.round(word.getBoundingClientRect().top),
          );
          const lines = [...new Set(tops)];
          const delay = (i: number) =>
            lines.indexOf(tops[i]) * 0.12 +
            tops.slice(0, i).filter((top) => top === tops[i]).length * 0.018;
          block.classList.add("editorial-entry");
          const tl = gsap.timeline({
            scrollTrigger: { trigger: block, start: "top 87%", once: true },
            onStart: () => {
              block.dataset.revealState = "entering";
            },
            onComplete: () => {
              block.dataset.revealState = "complete";
            },
          });
          tl.fromTo(
            words,
            { yPercent: 108, opacity: 1 },
            {
              yPercent: 0,
              opacity: 1,
              duration: 0.85,
              stagger: delay,
              ease: "power4.out",
            },
            0.08,
          )
            .fromTo(
              block,
              { "--rule-progress": 0 },
              { "--rule-progress": 1, duration: 0.95, ease: "power3.inOut" },
              0,
            )
            .fromTo(
              heading,
              { "--heading-scan": "0%", "--heading-glow": 0 },
              {
                "--heading-scan": "480%",
                "--heading-glow": 0.8,
                duration: 1.15,
                ease: "power2.inOut",
              },
              0.2,
            )
            .fromTo(
              heading,
              { "--text-sweep": "-20%" },
              { "--text-sweep": "125%", duration: 1.45, ease: "power2.inOut" },
              0.18,
            )
            .to(heading, { "--heading-glow": 0, duration: 0.25 }, 1.15);
          const label = block.querySelector(".eyebrow");
          const copy = block.querySelectorAll(":scope > p, :scope > div > p");
          if (label)
            tl.fromTo(
              label,
              { x: -7, opacity: 1 },
              { x: 0, opacity: 1, duration: 0.55 },
              0,
            );
          if (copy.length)
            tl.fromTo(
              copy,
              { y: 14, opacity: 1 },
              {
                y: 0,
                opacity: 1,
                duration: 0.7,
                stagger: 0.065,
                ease: "power3.out",
              },
              0.24,
            );
        });
        document
          .querySelectorAll<HTMLElement>(
            ".geometric-panel,.operational-photo,.industry-story > .image-relief,.service-editorial > .image-relief,.philosophy > .image-relief",
          )
          .forEach((panel) => {
            if (panel.getBoundingClientRect().bottom < 100) return;
            gsap.fromTo(
              panel,
              { clipPath: "inset(9% 0% 0% 0%)", opacity: 1 },
              {
                clipPath: "inset(0% 0% 0% 0%)",
                opacity: 1,
                duration: 1.15,
                ease: "power3.inOut",
                scrollTrigger: { trigger: panel, start: "top 91%", once: true },
              },
            );
          });
        document
          .querySelectorAll<HTMLElement>(
            ".photo:not(.image-relief):not(.page-banner),.service-preview-image:not(.relief-preview)",
          )
          .forEach((photo) => {
            gsap.fromTo(
              photo,
              { clipPath: "inset(18% 0 0 12%)" },
              {
                clipPath: "inset(0% 0 0 0%)",
                duration: 1.15,
                ease: "power3.inOut",
                scrollTrigger: { trigger: photo, start: "top 91%", once: true },
              },
            );
          });
        document
          .querySelectorAll<HTMLElement>(".closing")
          .forEach((closing) => {
            gsap.fromTo(
              closing.querySelector(".closing-glyph"),
              { rotation: -25, scale: 0.65 },
              {
                rotation: 0,
                scale: 1.1,
                ease: "none",
                scrollTrigger: {
                  trigger: closing,
                  start: "top bottom",
                  end: "bottom top",
                  scrub: 1,
                },
              },
            );
          });
      });
      let resizeFrame = 0;
      const resize = () => {
        cancelAnimationFrame(resizeFrame);
        resizeFrame = requestAnimationFrame(() => {
          originals.forEach(({ heading }) => {
            if (!heading.isConnected) return;
            const bounds = heading.getBoundingClientRect();
            heading.style.setProperty("--heading-width", `${bounds.width}px`);
            heading
              .querySelectorAll<HTMLElement>(".type-word")
              .forEach((word) =>
                word.style.setProperty(
                  "--word-offset",
                  `${word.getBoundingClientRect().left - bounds.left}px`,
                ),
              );
          });
        });
      };
      window.addEventListener("resize", resize, { passive: true });
      cleanup = () => {
        window.removeEventListener("resize", resize);
        cancelAnimationFrame(resizeFrame);
        ctx.revert();
        document
          .querySelectorAll(".map-shell.reveal-ready")
          .forEach((map) => map.classList.remove("reveal-ready", "in-view"));
        document
          .querySelectorAll<HTMLElement>("[data-scroll-focus]")
          .forEach((item) => {
            delete item.dataset.scrollFocus;
          });
        document
          .querySelectorAll<HTMLElement>(
            ".service-navigation a[aria-current],.industry-jump a[aria-current]",
          )
          .forEach((item) => {
            item.removeAttribute("aria-current");
          });
        for (const original of originals) {
          if (!original.heading.isConnected) continue;
          original.heading.innerHTML = original.html;
          original.heading.style.removeProperty("--heading-width");
          original.heading.classList.remove("heading-lit", "heading-sweeping");
          if (original.label === null)
            original.heading.removeAttribute("aria-label");
          else original.heading.setAttribute("aria-label", original.label);
        }
        document
          .querySelectorAll<HTMLElement>(".editorial-entry")
          .forEach((block) => {
            block.classList.remove("editorial-entry");
            delete block.dataset.revealState;
          });
      };
    };
    const decide = () => {
      generation++;
      cleanup?.();
      cleanup = undefined;
      observer?.disconnect();
      clearTimeout(timer);
      if (media.matches) return;
      if (location.pathname === "/") {
        const intro = document.getElementById("intro");
        if (!intro) return;
        observer = new IntersectionObserver(
          (entries) => {
            if (entries.some((entry) => entry.isIntersecting)) {
              observer?.disconnect();
              void begin();
            }
          },
          { rootMargin: "250px" },
        );
        observer.observe(intro);
        document
          .querySelectorAll(".section-heading,.operational-photo")
          .forEach((item) => observer?.observe(item));
      } else timer = window.setTimeout(() => void begin(), 180);
    };
    decide();
    media.addEventListener("change", decide);
    return () => {
      cancelled = true;
      clearTimeout(timer);
      observer?.disconnect();
      media.removeEventListener("change", decide);
      cleanup?.();
    };
  }, [location.pathname]);
  return null;
}
