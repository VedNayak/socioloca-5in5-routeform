import { useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import PageOpening from "./PageOpening";
import CargoWorkbench, { CargoDocuments, cargoTotals } from "./CargoWorkbench";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Download,
  Package,
  Plane,
  Ship,
  Truck,
  Warehouse,
} from "lucide-react";

type FormData = {
  mode: string;
  origin: string;
  destination: string;
  category: string;
  weight: string;
  length: string;
  width: string;
  height: string;
  pieces: string;
  container: string;
  temperature: string;
  storage: string;
  ready: string;
  timeline: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  notes: string;
  consent: boolean;
};
type FieldKey = keyof FormData;
const modes = [
  { id: "ocean", name: "Ocean freight", icon: Ship },
  { id: "air", name: "Air freight", icon: Plane },
  { id: "land", name: "Land transport", icon: Truck },
  { id: "warehousing", name: "Warehousing", icon: Warehouse },
  { id: "customs", name: "Cargo support", icon: Package },
];
const steps = ["Route", "Cargo", "Timing", "Contact", "Review"];
const blank: FormData = {
  mode: "ocean",
  origin: "",
  destination: "",
  category: "",
  weight: "450",
  length: "120",
  width: "80",
  height: "100",
  pieces: "2",
  container: "LCL / shared container",
  temperature: "",
  storage: "",
  ready: "",
  timeline: "Flexible / advise me",
  name: "",
  company: "",
  email: "",
  phone: "",
  notes: "",
  consent: false,
};
const today = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Dubai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

export default function Quote() {
  const [params] = useSearchParams();
  const requested = params.get("mode");
  const [data, setData] = useState<FormData>({
    ...blank,
    mode: modes.some((m) => m.id === requested) ? requested! : "ocean",
  });
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<Partial<Record<FieldKey, string>>>({});
  const [complete, setComplete] = useState(false);
  const [preparing, setPreparing] = useState(false);
  const [downloadError, setDownloadError] = useState("");
  const form = useRef<HTMLFormElement>(null);
  const title = useRef<HTMLHeadingElement>(null);
  const set = (key: FieldKey, value: string | boolean) => {
    setData((d) => ({ ...d, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };
  const validate = () => {
    const e: Partial<Record<FieldKey, string>> = {};
    const required = (key: FieldKey, message: string) => {
      if (!String(data[key]).trim()) e[key] = message;
    };
    if (step === 0 || step === 4) {
      required("origin", "Enter the origin city or facility.");
      required("destination", "Enter the destination city or facility.");
      if (
        ["ocean", "air", "land"].includes(data.mode) &&
        data.origin.trim().toLowerCase() ===
          data.destination.trim().toLowerCase() &&
        data.origin.trim()
      )
        e.destination =
          "Choose a different destination, or describe the storage site.";
    }
    if (step === 1 || step === 4) {
      required("category", "Choose a cargo category.");
      for (const key of [
        "weight",
        "length",
        "width",
        "height",
        "pieces",
      ] as const) {
        if (
          !data[key] ||
          !Number.isFinite(Number(data[key])) ||
          Number(data[key]) <= 0
        )
          e[key] = "Enter a number greater than zero.";
      }
      for (const key of ["length", "width", "height"] as const) {
        if (Number(data[key]) > 3000)
          e[key] = "Use up to 3,000 cm; describe larger cargo in the notes.";
      }
      if (Number(data.pieces) > 100000) e.pieces = "Use up to 100,000 pieces.";
      if (Number(data.weight) > 10000000)
        e.weight = "Use up to 10,000,000 kg per piece.";
      if (Number(data.pieces) % 1 !== 0)
        e.pieces = "Enter a whole number of pieces.";
      if (data.mode === "warehousing")
        required("storage", "Enter the estimated storage period.");
    }
    if (step === 2 || step === 4) {
      required("ready", "Choose a cargo-ready date.");
      if (data.ready && data.ready < today())
        e.ready = "Choose today or a future date.";
    }
    if (step === 3 || step === 4) {
      required("name", "Enter your full name.");
      required("company", "Enter your company or organisation.");
      required("email", "Enter your email address.");
      if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email))
        e.email = "Enter a valid email address.";
      required("phone", "Enter a contact phone number.");
      if (data.phone && data.phone.replace(/\D/g, "").length < 7)
        e.phone = "Enter a phone number with at least 7 digits.";
    }
    if (step === 4 && !data.consent)
      e.consent = "Please acknowledge the local demo and privacy notice.";
    setErrors(e);
    const first = Object.keys(e)[0];
    if (first)
      requestAnimationFrame(() => document.getElementById(first)?.focus());
    return Object.keys(e).length === 0;
  };
  const go = (n: number) => {
    setStep(n);
    setErrors({});
    requestAnimationFrame(() => title.current?.focus());
  };
  const advance = () => {
    if (!validate()) return;
    if (step < 4) go(step + 1);
    else {
      setPreparing(true);
      window.setTimeout(() => {
        setPreparing(false);
        setComplete(true);
        requestAnimationFrame(() => title.current?.focus());
      }, 450);
    }
  };
  const summary = () =>
    `ROUTEFORM LOGISTICS — DEMO SHIPMENT BRIEF\nIndependent SocioLoca concept. No data transmitted.\n\nMode: ${modes.find((m) => m.id === data.mode)?.name}\nOrigin: ${data.origin}\nDestination: ${data.destination}\nCargo: ${data.category}\nWeight per piece: ${data.weight} kg\nTotal gross weight: ${cargoTotals(data).weight} kg\nTotal volume (identical pieces): ${cargoTotals(data).volume.toFixed(3)} m³\nPackage dimensions: ${data.length} × ${data.width} × ${data.height} cm\nPieces: ${data.pieces}\n${data.mode === "ocean" ? `Load: ${data.container}\n` : ""}${data.mode === "warehousing" ? `Storage: ${data.storage}\n` : ""}${data.temperature ? `Handling conditions: ${data.temperature}\n` : ""}Ready: ${data.ready}\nTiming: ${data.timeline}\n\nContact: ${data.name}\nCompany: ${data.company}\nEmail: ${data.email}\nPhone: ${data.phone}\nNotes: ${data.notes || "None"}\n\nRouteform is fictional. No enquiry, rate or booking has been created.`;
  const download = () => {
    try {
      const url = URL.createObjectURL(
        new Blob([summary()], { type: "text/plain;charset=utf-8" }),
      );
      const a = document.createElement("a");
      a.href = url;
      a.download = "routeform-demo-shipment-brief.txt";
      a.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      setDownloadError(
        "The download could not start. Your brief remains visible below; copy it or try again.",
      );
    }
  };
  const field = (
    key: Exclude<FieldKey, "consent">,
    label: string,
    type = "text",
    placeholder = "",
    optional = false,
  ) => (
    <div className={`field ${key === "notes" ? "full" : ""}`}>
      <label htmlFor={key}>
        {label}
        {optional ? (
          <span> (optional)</span>
        ) : (
          <span aria-hidden="true"> *</span>
        )}
      </label>
      {key === "notes" ? (
        <textarea
          id={key}
          name={key}
          maxLength={1200}
          value={String(data[key])}
          onChange={(e) => set(key, e.target.value)}
          placeholder={placeholder}
        />
      ) : (
        <input
          id={key}
          name={key}
          form="quote-form"
          disabled={complete}
          type={type}
          min={
            type === "date" ? today() : type === "number" ? "0.01" : undefined
          }
          step={key === "pieces" ? "1" : "any"}
          maxLength={type === "text" ? 200 : undefined}
          autoComplete={
            ["name", "email"].includes(key)
              ? key
              : key === "phone"
                ? "tel"
                : key === "company"
                  ? "organization"
                  : "off"
          }
          value={String(data[key])}
          onChange={(e) => set(key, e.target.value)}
          placeholder={placeholder}
          aria-invalid={!!errors[key]}
          aria-describedby={errors[key] ? `${key}-error` : undefined}
        />
      )}{" "}
      {errors[key] && (
        <span id={`${key}-error`} className="field-error">
          {errors[key]}
        </span>
      )}
    </div>
  );
  const select = (
    key: Exclude<FieldKey, "consent">,
    label: string,
    options: string[],
  ) => (
    <div className="field">
      <label htmlFor={key}>{label} *</label>
      <select
        id={key}
        name={key}
        value={String(data[key])}
        onChange={(e) => set(key, e.target.value)}
        aria-invalid={!!errors[key]}
        aria-describedby={errors[key] ? `${key}-error` : undefined}
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o || "Select an option"}
          </option>
        ))}
      </select>
      {errors[key] && (
        <span id={`${key}-error`} className="field-error">
          {errors[key]}
        </span>
      )}
    </div>
  );
  return (
    <>
      <PageOpening
        kind="quote"
        label="YOUR NEXT MOVEMENT STARTS HERE"
        lines={["Let’s get your", "cargo moving."]}
        text="A few details. A clearer plan. Prepare your shipment brief in this local-only interactive demonstration."
      />
      <section id="quote-start" className="quote-intro section page-context">
        <span className="eyebrow">YOUR NEXT MOVEMENT STARTS HERE</span>
        <h2>
          Let’s get your
          <br />
          cargo moving<span className="orange">.</span>
        </h2>
        <p>
          Start with the cargo. Set the dimensions and watch the shipment take
          shape. Then add the route, timing and contact details for your local
          demo brief.
        </p>
      </section>
      <section className="quote-workbench section" aria-label="Cargo workbench">
        <CargoWorkbench data={data} />
        <div className="cargo-measurements">
          <span className="eyebrow">BUILD THE LOAD</span>
          <h2>
            Every dimension.
            <br />A different plan.
          </h2>
          <p>
            Enter centimetres and kilograms for one package. Volume and gross
            weight update for the full piece count.
          </p>
          <div className="fields">
            {field("length", "Package length (cm)", "number", "120")}
            {field("width", "Package width (cm)", "number", "80")}
            {field("height", "Package height (cm)", "number", "100")}
            {field("pieces", "Number of packages", "number")}
            {field("weight", "Weight per piece (kg)", "number", "450")}
          </div>
        </div>
      </section>
      <section className="quote-layout section">
        <aside className="quote-aside">
          <span className="eyebrow">YOUR SHIPMENT / LIVE SUMMARY</span>
          <h2>
            {cargoTotals(data).pieces}{" "}
            {cargoTotals(data).pieces === 1 ? "piece" : "pieces"}.<br />
            {modes.find((m) => m.id === data.mode)?.name}.
          </h2>
          <p className="quote-live-route">
            {data.origin || "Origin"} → {data.destination || "Destination"}
          </p>
          <CargoDocuments mode={data.mode} category={data.category} />
          <div className="demo-notice">
            <span className="status-dot" />
            <strong>LOCAL DEMONSTRATION</strong>
            <p>
              Routeform is fictional. This workbench sends nothing. Details stay
              in this page’s memory until refresh; you can download your brief
              at the end.
            </p>
          </div>
        </aside>
        <div className="quote-form-shell">
          {complete ? (
            <div className="confirmation">
              <CheckCircle2 size={48} />
              <span className="eyebrow">BRIEF PREPARED / DEMO COMPLETE</span>
              <h2 ref={title} tabIndex={-1}>
                Ready for a real
                <br />
                conversation.
              </h2>
              <p>
                Your demo brief is ready.{" "}
                <strong>Nothing was transmitted.</strong> No quote, booking or
                shipment reference has been created.
              </p>
              <dl>
                <dt>Route</dt>
                <dd>
                  {data.origin} → {data.destination}
                </dd>
                <dt>Transport</dt>
                <dd>{modes.find((m) => m.id === data.mode)?.name}</dd>
                <dt>Ready date</dt>
                <dd>{data.ready}</dd>
              </dl>
              <button className="button" onClick={download}>
                Download shipment brief <Download size={18} />
              </button>
              {downloadError && (
                <p role="alert" className="field-error">
                  {downloadError}
                </p>
              )}
              <details>
                <summary>View your full brief</summary>
                <pre className="brief-text">{summary()}</pre>
              </details>
              <button
                className="inline-link"
                onClick={() => {
                  setData({ ...blank });
                  setComplete(false);
                  go(0);
                }}
              >
                Prepare another brief <ArrowRight size={16} />
              </button>
            </div>
          ) : (
            <>
              <ol className="stepper" aria-label="Quote progress">
                {steps.map((s, i) => (
                  <li
                    key={s}
                    className={i === step ? "current" : i < step ? "done" : ""}
                    aria-current={i === step ? "step" : undefined}
                  >
                    <span>
                      {i < step ? (
                        <Check size={14} />
                      ) : (
                        String(i + 1).padStart(2, "0")
                      )}
                    </span>
                    {s}
                  </li>
                ))}
              </ol>
              <form
                ref={form}
                id="quote-form"
                noValidate
                onSubmit={(e) => {
                  e.preventDefault();
                  advance();
                }}
              >
                <div className="form-heading">
                  <span className="eyebrow">STEP {step + 1} OF 5</span>
                  <h2 ref={title} tabIndex={-1}>
                    {
                      [
                        "Where are we going?",
                        "Tell us about the cargo.",
                        "What does the timing look like?",
                        "Who should be in the conversation?",
                        "Review your shipment brief.",
                      ][step]
                    }
                  </h2>
                  <p>
                    {
                      [
                        "Choose a mode and define the two ends of your journey.",
                        "Use approximate figures if final measurements are not available.",
                        "Dates are planning inputs. Availability must be confirmed.",
                        "These details appear only in your local downloadable brief.",
                        "Check the details before preparing your local demo brief.",
                      ][step]
                    }
                  </p>
                </div>
                {step === 0 && (
                  <>
                    <fieldset className="mode-field">
                      <legend>Shipment type</legend>
                      <div className="mode-options">
                        {modes.map((m) => (
                          <label
                            key={m.id}
                            className={data.mode === m.id ? "selected" : ""}
                          >
                            <input
                              type="radio"
                              name="mode"
                              value={m.id}
                              checked={data.mode === m.id}
                              onChange={() => set("mode", m.id)}
                            />
                            <m.icon size={25} />
                            <span>{m.name}</span>
                          </label>
                        ))}
                      </div>
                    </fieldset>
                    <div className="fields">
                      {field(
                        "origin",
                        "Origin city / facility",
                        "text",
                        "e.g. Hong Kong",
                      )}
                      {field(
                        "destination",
                        data.mode === "warehousing"
                          ? "Storage destination"
                          : "Destination city / facility",
                        "text",
                        "e.g. Dubai",
                      )}
                    </div>
                  </>
                )}
                {step === 1 && (
                  <div className="fields">
                    {select("category", "Cargo category", [
                      "",
                      "General merchandise",
                      "Electronics & devices",
                      "Food & perishables",
                      "Industrial equipment",
                      "Exhibition cargo",
                      "Dangerous goods — assessment required",
                      "Other cargo",
                    ])}

                    {data.mode === "ocean" &&
                      select("container", "Load preference", [
                        "LCL / shared container",
                        "20 ft FCL",
                        "40 ft FCL",
                        "RoRo / break bulk",
                        "Please advise",
                      ])}

                    {data.mode === "warehousing" &&
                      field(
                        "storage",
                        "Estimated storage period",
                        "text",
                        "e.g. 30 days",
                      )}
                    {(data.category === "Food & perishables" ||
                      data.category.startsWith("Dangerous")) &&
                      field(
                        "temperature",
                        "Special handling requirements",
                        "text",
                        "Temperature range / classification",
                        true,
                      )}
                    <p className="small full">
                      Measurements above describe identical packages for volume
                      calculation. Add mixed sizes or special requirements in
                      the notes. Dangerous goods require separate assessment and
                      carrier acceptance.
                    </p>
                  </div>
                )}
                {step === 2 && (
                  <div className="fields">
                    {field("ready", "Cargo-ready date", "date")}
                    {select("timeline", "Delivery priority", [
                      "Flexible / advise me",
                      "Standard planning",
                      "Time-sensitive",
                      "Fixed event / required date",
                    ])}
                    {field(
                      "notes",
                      "Additional requirements",
                      "text",
                      "Required arrival date, mixed package sizes, handling conditions or documentation needs.",
                      true,
                    )}
                  </div>
                )}
                {step === 3 && (
                  <div className="fields">
                    {field("name", "Full name", "text", "Your name")}
                    {field(
                      "company",
                      "Company / organisation",
                      "text",
                      "Company name",
                    )}
                    {field(
                      "email",
                      "Email address",
                      "email",
                      "you@company.com",
                    )}
                    {field(
                      "phone",
                      "Phone number",
                      "tel",
                      "Include country code",
                    )}
                  </div>
                )}
                {step === 4 && (
                  <>
                    <div className="review-block">
                      {[
                        ["Route", `${data.origin} → ${data.destination}`, 0],
                        [
                          "Cargo",
                          `${data.category} · ${cargoTotals(data).weight} kg total · ${data.pieces} packages`,
                          1,
                        ],
                        [
                          "Dimensions",
                          `${data.length} × ${data.width} × ${data.height} cm`,
                          1,
                        ],
                        ["Timing", `${data.ready} · ${data.timeline}`, 2],
                        ["Contact", `${data.name} · ${data.company}`, 3],
                        ["Email / phone", `${data.email} · ${data.phone}`, 3],
                      ].map(([label, value, s]) => (
                        <div key={label}>
                          <span>{label}</span>
                          <strong>{value}</strong>
                          <button
                            type="button"
                            onClick={() => go(Number(s))}
                            aria-label={`Edit ${label}`}
                          >
                            Edit
                          </button>
                        </div>
                      ))}
                    </div>
                    <label className="consent">
                      <input
                        type="checkbox"
                        name="consent"
                        checked={data.consent}
                        onChange={(e) => set("consent", e.target.checked)}
                        aria-invalid={!!errors.consent}
                        aria-describedby="privacy-notice consent-error"
                      />
                      <span>
                        I understand this is a local demonstration and that no
                        enquiry will be sent.
                      </span>
                    </label>
                    <p id="privacy-notice" className="small">
                      Privacy: no form analytics, cookies or persistent storage
                      are used. Your entries remain in this browser page’s
                      memory. Downloads save a copy on your device. Closing or
                      refreshing clears the form.
                    </p>
                    {errors.consent && (
                      <p
                        id="consent-error"
                        className="field-error"
                        role="alert"
                      >
                        {errors.consent}
                      </p>
                    )}
                  </>
                )}
                <div className="form-actions">
                  {step > 0 ? (
                    <button
                      type="button"
                      className="text-button"
                      onClick={() => go(step - 1)}
                    >
                      <ArrowLeft size={17} /> Back
                    </button>
                  ) : (
                    <Link to="/services" className="text-button">
                      <ArrowLeft size={17} /> Explore services
                    </Link>
                  )}
                  <button className="button" type="submit" disabled={preparing}>
                    {preparing
                      ? "Preparing…"
                      : step === 4
                        ? "Prepare demo brief"
                        : "Continue"}
                    <ArrowRight size={18} />
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </section>
      <section className="quote-next section">
        <span className="eyebrow">FROM BRIEF TO MOVEMENT</span>
        <h2>What a real enquiry makes possible.</h2>
        <ol>
          {[
            [
              "Check the cargo",
              "Review the dimensions, packaging and handling requirements.",
            ],
            [
              "Develop the options",
              "Compare suitable modes, routing and documentation needs.",
            ],
            [
              "Agree the scope",
              "Confirm inclusions, exclusions and availability before a booking.",
            ],
          ].map(([title, text], i) => (
            <li key={title}>
              <span className="mono orange">0{i + 1}</span>
              <h3>{title}</h3>
              <p>{text}</p>
            </li>
          ))}
        </ol>
        <p className="section-note">
          Illustrative process only. This concept prepares a local brief and
          does not initiate these services.
        </p>
      </section>
    </>
  );
}
