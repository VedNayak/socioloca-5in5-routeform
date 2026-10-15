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
      timer = 0;
    const begin = async () => {
      if (cancelled || media.matches) return;
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([
        import("gsap"),
        import("gsap/ScrollTrigger"),
      ]);
      if (cancelled || media.matches) return;
      gsap.registerPlugin(ScrollTrigger);
      const originals: {
        heading: HTMLElement;
        html: string;
        label: string | null;
      }[] = [];
      const ctx = gsap.context(() => {
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
          ".page-intro h2,.quote-intro h2,.section-heading h2,.intro-text h2,.closing h2,.credibility h2,.service-editorial-title h2,.industry-story-head h2,.about-story h2,.philosophy h2",
        );
        headings.forEach((heading) => {
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
          gsap.fromTo(
            heading.querySelectorAll(".type-word"),
            { yPercent: 112, rotation: 3 },
            {
              yPercent: 0,
              rotation: 0,
              duration: 0.95,
              stagger: 0.035,
              ease: "power3.out",
              scrollTrigger: { trigger: heading, start: "top 91%", once: true },
              onStart: () => heading.classList.add("heading-sweeping"),
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
      cleanup = () => {
        ctx.revert();
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
          original.heading.classList.remove("heading-lit", "heading-sweeping");
          if (original.label === null)
            original.heading.removeAttribute("aria-label");
          else original.heading.setAttribute("aria-label", original.label);
        }
      };
    };
    const decide = () => {
      cleanup?.();
      cleanup = undefined;
      observer?.disconnect();
      clearTimeout(timer);
      if (media.matches) return;
      if (location.pathname === "/") {
        const intro = document.getElementById("intro");
        if (!intro) return;
        observer = new IntersectionObserver(
          ([entry]) => {
            if (entry.isIntersecting) {
              observer?.disconnect();
              void begin();
            }
          },
          { rootMargin: "250px" },
        );
        observer.observe(intro);
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
