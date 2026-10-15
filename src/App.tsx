import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link, NavLink, Route, Routes, useLocation } from "react-router-dom";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronDown,
  Menu,
  Plus,
  X,
} from "lucide-react";
import Network from "./Network";
import FreightExperience from "./FreightExperience";
import PageOpening from "./PageOpening";
import LogisticsIcon from "./LogisticsIcon";
import MotionDirection from "./MotionDirection";
import JourneyIcon from "./JourneyIcon";
import Quote from "./Quote";
import ImageRelief from "./components/ui/media-assembly";
import { useScrollSequence } from "./useScrollSequence";
import { industries, journey, services } from "./data";

const nav = [
  ["/services", "Services"],
  ["/industries", "Industries & solutions"],
  ["/about", "About Routeform"],
];
const metadata: Record<string, [string, string]> = {
  "/": [
    "Commerce, in motion.",
    "Explore Routeform Logistics services through an independent SocioLoca design concept.",
  ],
  "/services": [
    "A considered route for every cargo.",
    "Explore a fictional freight system spanning air, ocean, road, storage and documentation.",
  ],
  "/industries": [
    "Built around what you move.",
    "Illustrative logistics scenarios for electronics, perishables, industrial cargo and trade.",
  ],
  "/about": [
    "Built around cargo. Connected by design.",
    "Meet the fictional Routeform brand and its cargo-first operating philosophy.",
  ],
  "/quote": [
    "Prepare your shipment brief.",
    "A local-only demonstration quote workflow. No enquiry is sent and no booking is created.",
  ],
};
export function Logo() {
  return (
    <span className="wordmark">
      <svg viewBox="0 0 38 34" aria-hidden="true">
        <path
          d="M3 3h23l9 9v10H20l15 12H23L9 22v12H3V3zm7 7v6h18v-3l-3-3H10z"
          fill="currentColor"
        />
      </svg>
      <span>
        ROUTEFORM<small>FREIGHT, CONSIDERED.</small>
      </span>
    </span>
  );
}
export function Button({
  to,
  children,
  outline = false,
}: {
  to: string;
  children: ReactNode;
  outline?: boolean;
}) {
  return (
    <Link to={to} className={`button ${outline ? "button-outline" : ""}`}>
      {children}
      <ArrowUpRight size={19} />
    </Link>
  );
}
function Photo({
  name,
  alt,
  className = "",
  eager = false,
}: {
  name: string;
  alt: string;
  className?: string;
  eager?: boolean;
}) {
  return (
    <ImageRelief name={name} alt={alt} className={className} eager={eager} />
  );
}

function Header() {
  const [open, setOpen] = useState(false);
  const [mega, setMega] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const menuRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handle = () =>
      setScrolled((previous) =>
        previous ? window.scrollY > 8 : window.scrollY > 40,
      );
    window.addEventListener("scroll", handle, { passive: true });
    handle();
    return () => window.removeEventListener("scroll", handle);
  }, []);
  useEffect(() => {
    setOpen(false);
    setMega(false);
  }, [location.pathname]);
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.querySelector<HTMLElement>("a")?.focus();
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        menuRef.current?.focus();
      }
      if (e.key === "Tab") {
        const els = Array.from(
          panelRef.current?.querySelectorAll<HTMLElement>("a,button") || [],
        );
        const first = els[0];
        const last = els[els.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", key);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", key);
    };
  }, [open]);
  return (
    <header className={`site-header home-header ${scrolled ? "scrolled" : ""}`}>
      <div className="concept-banner">
        <span>INDEPENDENT DESIGN CONCEPT BY SOCIOLOCA</span>
        <Link to="/about#concept">
          A fictional logistics brand <ArrowUpRight size={11} />
        </Link>
      </div>
      <div className="header-inner">
        <Link to="/" aria-label="Routeform Logistics concept home">
          <Logo />
        </Link>
        <nav className="desktop-nav" aria-label="Main navigation">
          <div className="nav-services" onMouseLeave={() => setMega(false)}>
            <div className="service-nav-link">
              <NavLink to="/services">Services</NavLink>
              <button
                onClick={() => setMega(!mega)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") setMega(false);
                }}
                aria-label="Explore service menu"
                aria-expanded={mega}
                aria-controls="service-menu"
              >
                <ChevronDown size={14} />
              </button>
            </div>
            {mega && (
              <div
                id="service-menu"
                className="mega-menu"
                onKeyDown={(e) => {
                  if (e.key === "Escape") setMega(false);
                }}
              >
                <span className="eyebrow">FIND YOUR NEXT MOVEMENT</span>
                {services.map((s) => (
                  <Link key={s.id} to={`/services#${s.id}`}>
                    <span className="mono">{s.number}</span>
                    <span>{s.name}</span>
                    <ArrowUpRight size={16} />
                  </Link>
                ))}
                <Link to="/services" className="mega-all">
                  Explore all services <ArrowRight size={17} />
                </Link>
              </div>
            )}
          </div>
          {nav.slice(1).map(([to, label]) => (
            <NavLink key={to} to={to}>
              {label}
            </NavLink>
          ))}
        </nav>
        <Link className="header-quote" to="/quote">
          <span className="quote-label-long">Request a quote</span>
          <span className="quote-label-short">Quote</span>{" "}
          <ArrowUpRight size={16} />
        </Link>
        <button
          ref={menuRef}
          className="menu-toggle"
          aria-label="Open navigation"
          aria-expanded={open}
          aria-controls="mobile-menu"
          onClick={() => setOpen(true)}
        >
          <Menu />
        </button>
      </div>
      {open && (
        <div
          ref={panelRef}
          id="mobile-menu"
          className="mobile-menu"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation"
        >
          <div className="mobile-top">
            <Link to="/" onClick={() => setOpen(false)}>
              <Logo />
            </Link>
            <button
              aria-label="Close navigation"
              onClick={() => {
                setOpen(false);
                menuRef.current?.focus();
              }}
            >
              <X />
            </button>
          </div>
          <nav aria-label="Mobile navigation">
            <Link to="/">
              Home <ArrowUpRight />
            </Link>
            {nav.map(([to, label]) => (
              <Link key={to} to={to}>
                {label}
                <ArrowUpRight />
              </Link>
            ))}
            <Link to="/quote">
              Request a quote <ArrowUpRight />
            </Link>
          </nav>
          <span className="eyebrow">CARGO / ROUTE / HANDOVER</span>
          <p>Independent SocioLoca demonstration.</p>
        </div>
      )}
    </header>
  );
}

function Closing() {
  return (
    <section className="closing section">
      <svg className="closing-glyph" viewBox="0 0 38 34" aria-hidden="true">
        <path
          d="M3 3h23l9 9v10H20l15 12H23L9 22v12H3V3zm7 7v6h18v-3l-3-3H10z"
          fill="none"
          stroke="currentColor"
          strokeWidth=".25"
        />
      </svg>
      <span className="eyebrow">THE NEXT MOVE IS YOURS</span>
      <div>
        <h2>
          Great journeys start
          <br />
          with a conversation<span className="orange">.</span>
        </h2>
        <Button to="/quote">Plan your shipment</Button>
      </div>
      <p>
        Bring the cargo into focus. Explore the workbench and build a brief for
        your next movement.
      </p>
    </section>
  );
}
function Footer() {
  const [year, setYear] = useState(2026);
  useEffect(() => setYear(new Date().getFullYear()), []);
  return (
    <footer className="footer dark section">
      <div className="footer-main">
        <div>
          <Link to="/" aria-label="Routeform Logistics concept home">
            <Logo />
          </Link>
          <p>
            Cargo first.
            <br />
            Every handover considered.
          </p>
          <span className="mono muted">CARGO / ROUTE / HANDOVER</span>
        </div>
        <div>
          <span className="eyebrow">EXPLORE</span>
          {nav.map(([to, label]) => (
            <Link key={to} to={to}>
              {label}
            </Link>
          ))}
          <Link to="/quote">Request a quote</Link>
        </div>
        <div>
          <span className="eyebrow">SERVICES</span>
          {services.map((s) => (
            <Link key={s.id} to={`/services#${s.id}`}>
              {s.name}
            </Link>
          ))}
        </div>
        <div>
          <span className="eyebrow">EXPLORE THE CONCEPT</span>
          <Link to="/quote">
            Build a shipment brief <ArrowUpRight size={14} />
          </Link>
          <Link to="/about#concept">About this fictional brand</Link>
          <p>
            A freight-forwarding direction by SocioLoca.
            <br />
            No real offices or booking desk.
          </p>
        </div>
      </div>
      <div className="footer-bottom">
        <p>
          © {year} SocioLoca. Routeform is a fictional logistics brand. All
          scenes and routes are illustrative.
        </p>
        <Link to="/about#concept">Concept & privacy notice</Link>
        <span className="mono">ROUTEFORM / CONCEPT 01</span>
      </div>
    </footer>
  );
}

function SequenceScrollCue({
  enabled,
  active,
}: {
  enabled: boolean;
  active: number;
}) {
  return (
    <p className="sequence-scroll-cue mono">
      {!enabled
        ? "Choose a stage below"
        : `${active === 4 ? "Continue below" : "Scroll to explore"} ↓  ${active + 1} / 5`}
    </p>
  );
}

function Journey({ compact = false }: { compact?: boolean }) {
  const { root, active, choose, enabled } = useScrollSequence(5);
  return (
    <section
      ref={root}
      className={`journey section scroll-sequence ${enabled ? "sequence-enhanced" : ""} ${compact ? "compact" : ""}`}
      data-sequence-active={active}
    >
      <div className="sequence-sticky">
        <SequenceScrollCue enabled={enabled} active={active} />
        <div className="section-heading reveal">
          <div>
            <span className="eyebrow">
              {compact
                ? "THE OPERATIONAL WORKFLOW"
                : "05 / THE SHIPMENT JOURNEY"}
            </span>
            <h2>
              One journey.
              <br />
              Every detail considered.
            </h2>
          </div>
          <p>
            A planning sequence from the first conversation to the final
            handover. Scroll through each stage, or choose one to explore.
          </p>
        </div>
        <div
          className="journey-tabs"
          role="tablist"
          aria-label="Shipment planning stages"
        >
          {journey.map((s, i) => (
            <button
              key={s.name}
              role="tab"
              id={`journey-tab-${i}`}
              aria-selected={active === i}
              aria-controls="journey-panel"
              tabIndex={active === i ? 0 : -1}
              onClick={() => choose(i)}
              onKeyDown={(e) => {
                if (
                  ["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)
                ) {
                  e.preventDefault();
                  const next =
                    e.key === "Home"
                      ? 0
                      : e.key === "End"
                        ? 4
                        : (active + (e.key === "ArrowRight" ? 1 : 4)) % 5;
                  choose(next);
                  document.getElementById(`journey-tab-${next}`)?.focus();
                }
              }}
            >
              <span className="mono">0{i + 1}</span>
              {s.name}
              <span className="stage-dot" />
            </button>
          ))}
        </div>
        <div
          className="journey-panel"
          id="journey-panel"
          role="tabpanel"
          aria-labelledby={`journey-tab-${active}`}
          tabIndex={0}
        >
          <span className="journey-number">0{active + 1}</span>
          <div key={active} className="fade-in">
            <h3>{journey[active].title}</h3>
            <p>{journey[active].text}</p>
            <span className="mono">{journey[active].detail}</span>
          </div>
          <JourneyIcon stage={active} />
        </div>
        <p className="section-note">
          Illustrative process. Actual scope and milestones are agreed for each
          shipment.
        </p>
      </div>
    </section>
  );
}

function Home() {
  return (
    <>
      <FreightExperience />
      <section id="intro" className="intro section">
        <div className="intro-label reveal">
          <span className="eyebrow">01 / LOGISTICS, CONNECTED</span>
          <span className="mini-coordinate mono">
            25.2048° N<br />
            55.2708° E
          </span>
        </div>
        <div className="intro-text reveal">
          <h2>
            The world keeps moving.
            <br />
            So should your business.
          </h2>
          <p>
            The cargo defines the route. The details make it work. Routeform
            explores freight, storage and cargo support as one connected
            journey.
          </p>
          <Link to="/about" className="inline-link">
            Get to know Routeform <ArrowUpRight size={19} />
          </Link>
        </div>
      </section>
      <Network />
      <section className="home-services section">
        <div className="section-heading reveal">
          <div>
            <span className="eyebrow">03 / BUILT FOR YOUR NEXT MOVE</span>
            <h2>
              Different cargo.
              <br />
              One connected approach.
            </h2>
          </div>
          <Button to="/services" outline>
            Explore all services
          </Button>
        </div>
        <div className="service-triptych">
          {services.slice(0, 3).map((s, i) => (
            <article
              className={`service-preview reveal preview-${i}`}
              key={s.id}
            >
              <div className="service-preview-image relief-preview">
                <ImageRelief
                  name={s.image}
                  alt={`Illustrative ${s.name.toLowerCase()} scene`}
                />
                <span className="service-index mono">
                  {s.number} / {s.id.toUpperCase()}
                </span>
                <Link
                  to={`/services#${s.id}`}
                  aria-label={`Explore ${s.name}`}
                  className="round-arrow"
                >
                  <ArrowUpRight />
                </Link>
              </div>
              <Link to={`/services#${s.id}`}>
                <h3>{s.name}</h3>
              </Link>
              <p>{s.short}</p>
              <div className="tags">
                {s.tags.slice(0, 2).map((t) => (
                  <span key={t}>{t}</span>
                ))}
              </div>
            </article>
          ))}
        </div>
        <div className="support-services">
          {services.slice(3).map((s) => (
            <Link key={s.id} to={`/services#${s.id}`}>
              <span className="mono">{s.number}</span>
              <h3>{s.name}</h3>
              <p>{s.short}</p>
              <ArrowUpRight />
            </Link>
          ))}
        </div>
      </section>
      <section className="operational section">
        <div className="operational-photo reveal">
          <Photo
            name="warehouse"
            alt="Illustrative warehouse aisle with racking and cargo pallets"
          />
          <span className="photo-note mono">RECEIVE / PREPARE / RELEASE</span>
        </div>
        <div className="operational-text reveal">
          <span className="eyebrow">BEHIND EVERY MOVEMENT</span>
          <h2>
            The work between
            <br />
            the milestones.
          </h2>
          <p>
            A shipment is more than a transport mode. Receiving, packing,
            documentation and clearance connect the stages that make movement
            possible.
          </p>
          <ul className="check-list">
            <li>
              <Check /> Warehousing and distribution
            </li>
            <li>
              <Check /> Packing, labelling and consolidation
            </li>
            <li>
              <Check /> Customs and documentation support
            </li>
          </ul>
          <Link to="/services#warehousing" className="inline-link">
            Inside the operation <ArrowUpRight size={18} />
          </Link>
        </div>
      </section>
      <section className="home-industries section">
        <div className="section-heading reveal">
          <div>
            <span className="eyebrow">04 / THE CARGO COMES FIRST</span>
            <h2>
              Built around
              <br />
              what you move.
            </h2>
          </div>
          <p>
            Different products ask different questions. Explore illustrative
            planning examples for four very different cargo needs.
          </p>
        </div>
        <div className="industry-feature">
          <Photo
            name="electronics"
            alt="Illustrative technician scanning an electronics cargo box"
            className="reveal"
          />
          <div className="industry-links">
            {industries.map((i, n) => (
              <Link to={`/industries#${i.id}`} key={i.id}>
                <span className="mono">0{n + 1}</span>
                <h3>{i.name}</h3>
                <ArrowUpRight size={20} />
              </Link>
            ))}
          </div>
        </div>
      </section>
      <Journey />
      <section className="credibility section dark framed-section">
        <div className="geometric-panel">
          <span className="eyebrow">06 / THE ROUTEFORM PRINCIPLE</span>
          <h2>
            Make the complex.
            <br />
            Feel considered.
          </h2>
          <div className="evidence-row">
            <div>
              <span className="mono">01 / DEFINE</span>
              <h3>
                Cargo before
                <br />a carrier.
              </h3>
              <p>
                Weight, dimensions and handling conditions shape the plan before
                a mode is selected.
              </p>
              <Link to="/quote">
                Build the cargo brief <ArrowUpRight size={16} />
              </Link>
            </div>
            <div>
              <span className="mono">02 / CONNECT</span>
              <h3>
                One brief.
                <br />
                Every handover.
              </h3>
              <p>
                Transport, storage and paperwork belong in the same
                conversation.
              </p>
              <Link to="/services">
                Explore the service system <ArrowUpRight size={16} />
              </Link>
            </div>
            <div>
              <span className="mono">03 / EXPLAIN</span>
              <h3>
                Clear scope.
                <br />
                Fewer unknowns.
              </h3>
              <p>
                Explain the choices, assumptions and next steps instead of
                promising an unqualified transit time.
              </p>
              <Link to="/about">
                Meet the idea <ArrowUpRight size={16} />
              </Link>
            </div>
          </div>
          <p className="section-note">
            A fictional operating philosophy, demonstrated through original
            interactive studies. No company performance statistics are implied.
          </p>
        </div>
      </section>
      <Closing />
    </>
  );
}

function PageIntro({
  label,
  title,
  text,
}: {
  label: string;
  title: ReactNode;
  text: string;
}) {
  const pathname = useLocation().pathname.replace(/\/+$/, "") || "/";
  const lines =
    pathname === "/about"
      ? ["Built around cargo.", "Connected by design."]
      : pathname === "/industries"
        ? ["Built around", "what you move."]
        : ["A considered route", "for every cargo."];
  return (
    <>
      <PageOpening
        kind={
          pathname === "/about"
            ? "about"
            : pathname === "/industries"
              ? "industries"
              : "services"
        }
        label={label}
        lines={lines}
        text={text}
      />
      <section id="intro" className="page-intro page-context section">
        <span className="eyebrow">{label}</span>
        <div className="page-intro-main">
          <h2>
            {title}
            <span className="orange">.</span>
          </h2>
          <p>{text}</p>
        </div>
      </section>
    </>
  );
}
const faqs = [
  [
    "How do I choose between air, ocean and land?",
    "Start with origin, destination, cargo size, handling needs and timing. Air may suit time-sensitive cargo, ocean may suit larger loads, and road supports suitable regional movements. A real operations team would confirm the available options and rates.",
  ],
  [
    "What information helps prepare a quote?",
    "Provide shipment origin and destination, cargo description, package count, gross weight, dimensions, ready date and any special handling requirements. Add the requested scope, such as collection, storage or onward delivery.",
  ],
  [
    "Where does documentation fit in?",
    "Documentation is part of the journey: invoices, packing lists, transport documents and commodity-specific approvals. The right checklist depends on origin, destination and goods. This fictional concept illustrates how that conversation could work.",
  ],
  [
    "Can I ship perishables or dangerous goods?",
    "Perishable cargo needs product-specific handling and a plan for each handover. Dangerous or regulated cargo requires a separate assessment; this concept does not confirm acceptance. Discuss the commodity, packaging, documents, route and carrier with an appointed operations team before arranging a movement.",
  ],
  [
    "Are the sample routes and timings live?",
    "No. The network, scenarios and process graphics on this independent concept are illustrative. They are not live tracking, confirmed company lanes or transit guarantees.",
  ],
  [
    "Will the quote form send my enquiry?",
    "No. This demonstration prepares a brief locally in your browser. Nothing is sent or persistently stored. You can review and download the brief. Routeform is fictional and has no live booking desk.",
  ],
];
function FAQs() {
  return (
    <section className="faqs section">
      <div>
        <span className="eyebrow">BEFORE YOUR NEXT MOVE</span>
        <h2>
          A few useful
          <br />
          answers.
        </h2>
        <p>
          For shipment-specific advice, speak with an appointed operations team.
        </p>
      </div>
      <div>
        {faqs.map(([q, a]) => (
          <details key={q}>
            <summary>
              {q}
              <Plus size={19} />
            </summary>
            <p>{a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
function Services() {
  const [filter, setFilter] = useState("all");
  const displayed = services.filter(
    (s) =>
      filter === "all" ||
      (filter === "transport"
        ? ["ocean", "air", "land"].includes(s.id)
        : ["warehousing", "customs"].includes(s.id)),
  );
  return (
    <>
      <PageIntro
        label="OUR SERVICES / THE WHOLE MOVEMENT"
        title={
          <>
            A considered route
            <br />
            for every cargo
          </>
        }
        text="Every shipment has a different starting point. Connect transport, storage and cargo support around what your business needs."
      />
      <div className="service-navigation section">
        <div className="filter-tabs" aria-label="Filter services">
          {[
            ["all", "All services"],
            ["transport", "Transport"],
            ["support", "Storage & support"],
          ].map(([f, label]) => (
            <button
              key={f}
              aria-pressed={filter === f}
              onClick={() => setFilter(f)}
            >
              {label}
            </button>
          ))}
        </div>
        <nav aria-label="Jump to service">
          {displayed.map((s) => (
            <a key={s.id} href={`#${s.id}`}>
              {s.name}
              <ArrowDown size={13} />
            </a>
          ))}
        </nav>
      </div>
      <div className="service-editorials section">
        {displayed.map((s) => (
          <article
            className={`service-editorial service-${s.id} reveal`}
            id={s.id}
            key={s.id}
          >
            <div className="service-editorial-title">
              <span className="eyebrow">
                {s.number} / {s.name.toUpperCase()}
              </span>
              <h2>{s.short}</h2>
              <p>{s.description}</p>
              <div className="tags">
                {s.tags.map((t) => (
                  <span key={t}>{t}</span>
                ))}
              </div>
            </div>
            <Photo
              name={s.image}
              alt={`Illustrative ${s.name.toLowerCase()} operation`}
            />
            <div className="service-detail">
              <div>
                <span className="eyebrow">WHAT IT COVERS</span>
                <ul>
                  {s.covers.map((c) => (
                    <li key={c}>
                      <Check size={15} />
                      {c}
                    </li>
                  ))}
                </ul>
                <Link to={`/quote?mode=${s.id}`} className="source-link">
                  Build a brief for this service ↗
                </Link>
              </div>
              <div>
                <span className="eyebrow">A TYPICAL PLANNING SEQUENCE</span>
                <ol>
                  {s.stages.map((st, i) => (
                    <li key={st}>
                      <span className="mono">0{i + 1}</span>
                      {st}
                    </li>
                  ))}
                </ol>
              </div>
              <div>
                <span className="eyebrow">ILLUSTRATIVE SCENARIO</span>
                <p>{s.scenario}</p>
                <p className="small">{s.consideration}</p>
                <Button to={`/quote?mode=${s.id}`} outline>
                  Plan {s.name.toLowerCase()}
                </Button>
              </div>
            </div>
          </article>
        ))}
      </div>
      <section className="comparison dark section framed-section">
        <div className="geometric-panel">
          <div className="section-heading">
            <div>
              <span className="eyebrow">CHOOSE WITH CONTEXT</span>
              <h2>
                The right mode
                <br />
                starts with the brief.
              </h2>
            </div>
            <p>
              General planning comparisons, not live rates, schedules or
              guarantees. Actual suitability depends on your shipment.
            </p>
          </div>
          <p className="comparison-scroll-hint mono" id="mode-scroll-hint">
            Scroll sideways to compare all modes{" "}
            <ArrowRight size={15} aria-hidden="true" />
          </p>
          <div
            className="table-scroll"
            tabIndex={0}
            role="region"
            aria-label="Transport mode comparison"
            aria-describedby="mode-scroll-hint"
          >
            <table>
              <caption>Illustrative transport mode planning guide</caption>
              <thead>
                <tr>
                  <th scope="col">Consideration</th>
                  <th scope="col">Ocean</th>
                  <th scope="col">Air</th>
                  <th scope="col">Land</th>
                </tr>
              </thead>
              <tbody>
                {[
                  [
                    "Common fit",
                    "Larger or consolidated loads",
                    "Time-sensitive consignments",
                    "Suitable regional movements",
                  ],
                  [
                    "Planning focus",
                    "Sailing cut-offs and port handling",
                    "Chargeable weight and acceptance",
                    "Border requirements and vehicle access",
                  ],
                  [
                    "Load options",
                    "FCL, LCL, RoRo, break bulk",
                    "Consolidated or project cargo",
                    "LTL, FTL and special movements",
                  ],
                  [
                    "Key trade-off",
                    "Schedule versus cargo scale",
                    "Speed versus freight cost",
                    "Route access versus flexibility",
                  ],
                ].map((row) => (
                  <tr key={row[0]}>
                    {row.map((cell, i) =>
                      i === 0 ? (
                        <th scope="row" key={cell}>
                          {cell}
                        </th>
                      ) : (
                        <td key={cell}>{cell}</td>
                      ),
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
      <Journey compact />
      <FAQs />
      <Closing />
    </>
  );
}

function SupplyChain() {
  const {
    root,
    active: selected,
    choose: setSelected,
    enabled,
  } = useScrollSequence(5);
  const chain = [
    {
      name: "Origin",
      text: "Confirm the pickup point, cargo readiness and packing needs.",
    },
    {
      name: "Consolidation",
      text: "Review package counts, storage or consolidation needs and supporting documents.",
    },
    {
      name: "Transport",
      text: "Coordinate the selected freight mode with suitable handling and confirmed capacity.",
    },
    {
      name: "Clearance",
      text: "Prepare arrival paperwork, required approvals and the applicable clearance procedure.",
    },
    {
      name: "Destination",
      text: "Agree delivery access, storage or onward distribution and the receiving handover.",
    },
  ];
  return (
    <section
      ref={root}
      className={`supply-chain section dark scroll-sequence ${enabled ? "sequence-enhanced" : ""}`}
      data-sequence-active={selected}
    >
      <div className="sequence-sticky geometric-panel">
        <SequenceScrollCue enabled={enabled} active={selected} />
        <div className="section-heading">
          <div>
            <span className="eyebrow">ILLUSTRATIVE SUPPLY CHAIN</span>
            <h2>
              See the connections.
              <br />
              Plan the handovers.
            </h2>
          </div>
          <p>
            Explore the decisions behind a sample multimodal shipment. Each
            stage informs the next.
          </p>
        </div>
        <div className="chain-steps" aria-label="Supply chain stages">
          {chain.map((c, i) => (
            <button
              key={c.name}
              aria-pressed={selected === i}
              aria-label={c.name}
              onClick={() => setSelected(i)}
            >
              <span className="chain-icon">
                <LogisticsIcon stage={i} />
              </span>
              <span className="mono">0{i + 1}</span>
              <span className="chain-name" aria-hidden="true">
                <span className="chain-label-full">{c.name}</span>
                <span className="chain-label-compact">
                  {c.name === "Consolidation" ? "Consol." : c.name}
                </span>
              </span>
              {i < 4 && <ArrowRight className="chain-arrow" size={20} />}
            </button>
          ))}
        </div>
        <div className="chain-detail">
          <span className="eyebrow">HANDOVER 0{selected + 1}</span>
          <h3>{chain[selected].name}</h3>
          <p>{chain[selected].text}</p>
        </div>
        <p className="section-note">
          Example planning diagram. This does not represent a live shipment or
          an actual operating procedure.
        </p>
      </div>
    </section>
  );
}
function Industries() {
  return (
    <>
      <PageIntro
        label="INDUSTRIES & SOLUTIONS / CARGO FIRST"
        title={
          <>
            Built around
            <br />
            what you move
          </>
        }
        text="The product changes the plan. Explore four illustrative cargo scenarios, each with its own handling, timing and documentation considerations."
      />
      <div className="industry-jump section">
        {industries.map((i) => (
          <a href={`#${i.id}`} key={i.id}>
            {i.name}
            <ArrowDown size={14} />
          </a>
        ))}
      </div>
      <section className="industry-stories section">
        {industries.map((i, n) => (
          <article
            id={i.id}
            key={i.id}
            className={`industry-story story-${n} reveal`}
          >
            <div className="industry-story-head">
              <span className="eyebrow">
                0{n + 1} / {i.label}
              </span>
              <h2>{i.name}</h2>
              <p>{i.text}</p>
            </div>
            <Photo
              name={i.image}
              alt={`Illustrative logistics application for ${i.name.toLowerCase()}`}
            />
            <div className="industry-story-details">
              <div>
                <span className="eyebrow">THE CHALLENGE</span>
                <p>{i.challenge}</p>
              </div>
              <div>
                <span className="eyebrow">THE LOGISTICS APPROACH</span>
                <p>{i.approach}</p>
                <Link to="/services" className="source-link">
                  Explore the supporting services ↗
                </Link>
              </div>
              <div className="example">
                <span className="eyebrow">
                  ILLUSTRATIVE EXAMPLE / NOT A CASE STUDY
                </span>
                <p>{i.example}</p>
                <Link className="inline-link" to="/quote">
                  Discuss a similar movement <ArrowUpRight size={17} />
                </Link>
              </div>
            </div>
          </article>
        ))}
      </section>
      <SupplyChain />
      <Closing />
    </>
  );
}

function About() {
  return (
    <>
      <PageIntro
        label="ABOUT ROUTEFORM / A CONSIDERED WAY FORWARD"
        title={
          <>
            Built around cargo.
            <br />
            Connected by design
          </>
        }
        text="Routeform is a fictional freight-forwarding brand built around a simple idea: a clearer shipment brief leads to a more considered journey."
      />
      <section className="about-story section">
        <span className="eyebrow">THE IDEA BEHIND THE MOVEMENT</span>
        <div>
          <h2>
            Less guesswork.
            <br />
            More understanding.
          </h2>
          <p className="large-copy">
            Logistics starts long before the cargo moves. It starts with
            understanding what is moving, what it needs and what could get in
            its way.
          </p>
          <p>
            We imagined Routeform as a business that makes those decisions
            visible. Freight, storage and cargo support share one brief, with
            the next handover always in view. This is an operating philosophy
            for the concept, rather than a claim about a real company.
          </p>
          <Link to="/services" className="inline-link">
            Explore the connected services <ArrowUpRight size={18} />
          </Link>
          <div className="foundation-year">
            <strong>01—05</strong>
            <span className="mono">
              UNDERSTAND / PLAN / PREPARE
              <br />
              MOVE / DELIVER
            </span>
          </div>
        </div>
      </section>
      <section className="locations dark section framed-section" id="locations">
        <div className="geometric-panel">
          <div className="section-heading">
            <div>
              <span className="eyebrow">A CONNECTED OPERATING MODEL</span>
              <h2>
                Think in handovers.
                <br />
                Not just destinations.
              </h2>
            </div>
            <p>
              A fictional service model with three connected responsibilities.
              These are operating roles, not real offices or a coverage claim.
            </p>
          </div>
          <div className="location-grid">
            <article>
              <span className="mono orange">01 / AT ORIGIN</span>
              <h3>
                Get ready
                <br />
                to move.
              </h3>
              <strong>Cargo preparation</strong>
              <p>
                Check packaging, record dimensions, establish access
                requirements and assemble the export brief.
              </p>
              <Link to="/services#customs">Documents & preparation ↗</Link>
            </article>
            <article>
              <span className="mono orange">02 / IN TRANSIT</span>
              <h3>
                Choose the
                <br />
                right movement.
              </h3>
              <strong>Freight coordination</strong>
              <p>
                Compare suitable modes and connect collection, carriage and any
                planned storage.
              </p>
              <Link to="/services#ocean">Transport choices ↗</Link>
            </article>
            <article>
              <span className="mono orange">03 / AT DESTINATION</span>
              <h3>
                Complete the
                <br />
                handover.
              </h3>
              <strong>Arrival & release</strong>
              <p>
                Plan clearance, receiving and delivery around the consignee’s
                needs and the cargo conditions.
              </p>
              <Link to="/services#warehousing">Storage & distribution ↗</Link>
            </article>
          </div>
          <p className="section-note">
            All network cities and shipping scenarios on this website are
            illustrative. Routeform operates no real facilities.
          </p>
        </div>
      </section>
      <section className="philosophy section">
        <Photo
          name="warehouse"
          alt="Illustrative cargo handling model"
          className="reveal"
        />
        <div className="reveal">
          <span className="eyebrow">OUR OPERATIONAL POINT OF VIEW</span>
          <h2>
            Clarity before cargo.
            <br />
            Care at every stage.
          </h2>
          <p>
            Three practical principles give the fictional brand its point of
            view.
          </p>
          {[
            [
              "Understand the requirement",
              "Ask about the cargo, scope and constraints before choosing a route.",
            ],
            [
              "Make the handovers clear",
              "Define the documents, handling and contacts needed at each stage.",
            ],
            [
              "Explain the next decision",
              "Show the options, assumptions and what needs confirmation.",
            ],
          ].map(([title, text], i) => (
            <div className="value-row" key={title}>
              <span className="mono">0{i + 1}</span>
              <div>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
      <section className="partnership section">
        <div>
          <span className="eyebrow">FROM IDEA TO SHIPMENT BRIEF</span>
          <h2>
            Make your next
            <br />
            movement tangible.
          </h2>
          <p>
            Try the cargo workbench. Set the dimensions, explore a mode and see
            a shipment brief take shape. No enquiry is sent.
          </p>
        </div>
        <Button to="/quote">Explore the workbench</Button>
      </section>
      <section className="concept-disclosure section" id="concept">
        <span className="eyebrow">TRANSPARENCY / ABOUT THIS WEBSITE</span>
        <h2>
          A fictional brand.
          <br />A real design direction.
        </h2>
        <div className="disclosure-grid">
          <div>
            <h3>Created by SocioLoca</h3>
            <p>
              Routeform is a fictional logistics identity created to demonstrate
              a digital direction for the freight sector. It is not a real
              freight forwarder and does not represent an existing logistics
              business. The concept can be tailored to a client following
              discovery.
            </p>
          </div>
          <div>
            <h3>Illustrative throughout</h3>
            <p>
              Services, routes, cargo scenarios and operating roles are concept
              content. Opening images and films are AI-generated illustrations,
              accompanied by original coded geometry. They show no real
              company’s equipment, employees or facilities. No clients,
              certifications, history or shipment volumes are asserted.
            </p>
          </div>
          <div>
            <h3>Your details stay here</h3>
            <p>
              The quote workbench does not transmit entries, track the form or
              store it persistently. Values remain in page memory until refresh
              or closure. Downloading a brief saves a copy on your device. There
              is no live booking or enquiry service.
            </p>
          </div>
        </div>
      </section>
      <Closing />
    </>
  );
}
function NotFound() {
  return (
    <section className="not-found section">
      <span className="eyebrow">404 / ROUTE NOT FOUND</span>
      <h1>
        Let’s find
        <br />a better route<span className="orange">.</span>
      </h1>
      <p>
        The page you’re looking for isn’t here. Explore the services or return
        to the beginning.
      </p>
      <div>
        <Button to="/">Return home</Button>
        <Button to="/services" outline>
          Explore services
        </Button>
      </div>
    </section>
  );
}

export default function App() {
  const location = useLocation();
  // Paint the first document immediately; subsequent routes keep the entrance.
  const [arrivalPath] = useState(location.pathname);
  const first = useRef(true);
  useEffect(() => {
    const pathname = location.pathname.replace(/\/+$/, "") || "/";
    const meta = metadata[pathname] || [
      "Page not found.",
      "Return to the Routeform independent concept home.",
    ];
    document.title = `${meta[0]} | Routeform — Independent concept`;
    document
      .querySelector('meta[name="description"]')
      ?.setAttribute("content", meta[1]);
    document
      .querySelector('meta[property="og:title"]')
      ?.setAttribute("content", document.title);
    document
      .querySelector('meta[property="og:description"]')
      ?.setAttribute("content", meta[1]);
    document
      .querySelector('meta[property="og:image"]')
      ?.setAttribute(
        "content",
        window.location.origin +
          (pathname === "/" || !metadata[pathname]
            ? "/images/cargo-cinema.webp"
            : `/images/opening-v6-${pathname.slice(1)}.webp`),
      );
    const canonical = document.querySelector('link[rel="canonical"]');
    if (canonical)
      canonical.setAttribute(
        "href",
        window.location.origin + location.pathname,
      );
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (location.hash) {
      requestAnimationFrame(() =>
        document
          .getElementById(location.hash.slice(1))
          ?.scrollIntoView({ behavior: reduce ? "instant" : "smooth" }),
      );
    } else window.scrollTo({ top: 0, behavior: "instant" });
    if (!first.current && !location.hash)
      document
        .querySelector<HTMLElement>("main")
        ?.focus({ preventScroll: true });
    first.current = false;
  }, [location.pathname, location.hash]);
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <Header />
      <MotionDirection />
      <main
        id="main"
        tabIndex={-1}
        key={location.pathname}
        className={`${location.pathname !== arrivalPath ? "page-enter" : ""} ${location.pathname === "/" ? "home-page" : ""}`}
      >
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/services" element={<Services />} />
          <Route path="/industries" element={<Industries />} />
          <Route path="/about" element={<About />} />
          <Route path="/quote" element={<Quote />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </>
  );
}
