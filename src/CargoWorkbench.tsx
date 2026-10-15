import { useId, useState } from "react";
import { Box, Scan } from "lucide-react";

export type Measurements = {
  length: string;
  width: string;
  height: string;
  pieces: string;
  weight: string;
};
export function cargoTotals(data: Measurements) {
  const number = (key: keyof Measurements) => {
    const n = Number(data[key]);
    return Number.isFinite(n) && n > 0 ? n : 0;
  };
  const pieces = Math.floor(number("pieces"));
  return {
    volume:
      (number("length") * number("width") * number("height") * pieces) / 1e6,
    weight: number("weight") * pieces,
    pieces,
  };
}
const format = (n: number, digits = 2) =>
  n.toLocaleString("en-GB", { maximumFractionDigits: digits });

/** Original orthographic cargo study. Dimensions drive geometry, not a fixed image. */
export default function CargoWorkbench({ data }: { data: Measurements }) {
  const [plan, setPlan] = useState(false);
  const id = useId().replaceAll(":", "");
  const dim = (v: string, fallback: number) =>
    Math.max(
      1,
      Math.min(
        3000,
        Number(v) > 0 && Number.isFinite(Number(v)) ? Number(v) : fallback,
      ),
    );
  const l = dim(data.length, 120),
    w = dim(data.width, 80),
    h = dim(data.height, 100);
  const scale = Math.min(1.15, 410 / (l + w), 225 / (h + (l + w) * 0.27));
  const project = (x: number, z: number, y = 0) =>
    plan
      ? [360 + (x - l / 2) * scale, 220 + (z - w / 2) * scale]
      : [
          360 + (x - z - (l - w) / 2) * scale,
          278 + (x + z - (l + w) / 2) * scale * 0.34 - y * scale,
        ];
  const p = (x: number, z: number, y = 0) => project(x, z, y).join(",");
  const poly = (points: number[][]) =>
    points.map(([x, z, y]) => p(x, z, y)).join(" ");
  const totals = cargoTotals(data);
  const lx = project(l / 2, -18),
    wz = project(l + 18, w / 2);
  return (
    <div className="cargo-study">
      <div className="cargo-study-top">
        <span className="eyebrow">LIVE CARGO STUDY / 01</span>
        <div
          className="cargo-view-controls"
          role="group"
          aria-label="Cargo view"
        >
          <button
            type="button"
            aria-pressed={!plan}
            onClick={() => setPlan(false)}
          >
            <Box size={15} />
            Spatial
          </button>
          <button
            type="button"
            aria-pressed={plan}
            onClick={() => setPlan(true)}
          >
            <Scan size={15} />
            Footprint
          </button>
        </div>
      </div>
      <svg
        viewBox="0 0 720 450"
        role="img"
        aria-label={`Illustrative ${plan ? "footprint" : "spatial"} cargo model, ${l} by ${w} by ${h} centimetres. One representative package; ${totals.pieces} same-size pieces in the brief.`}
      >
        <defs>
          <pattern
            id={`${id}-grid`}
            width="28"
            height="28"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M28 0H0V28"
              fill="none"
              stroke="#b0c6b8"
              strokeOpacity=".12"
              strokeWidth=".7"
            />
          </pattern>
        </defs>
        <rect width="720" height="450" fill="#101d21" />
        <rect
          x="24"
          y="40"
          width="672"
          height="362"
          fill={`url(#${id}-grid)`}
        />
        <path
          d="M24 72V40H56M664 40H696V72M696 370V402H664M56 402H24V370"
          stroke="#718b83"
          fill="none"
        />
        <g className="cargo-geometry">
          <polygon
            points={poly([
              [-22, -22, -8],
              [l + 22, -22, -8],
              [l + 22, w + 22, -8],
              [-22, w + 22, -8],
            ])}
            fill="#192d30"
            stroke="#47615d"
          />
          <polygon
            points={poly([
              [0, 0, 0],
              [l, 0, 0],
              [l, w, 0],
              [0, w, 0],
            ])}
            fill="#ac6240"
            stroke="#ff9c72"
          />
          {!plan && (
            <>
              <polygon
                points={poly([
                  [0, w, 0],
                  [l, w, 0],
                  [l, w, h],
                  [0, w, h],
                ])}
                fill="#a66846"
                stroke="#efba89"
                strokeWidth="1.2"
              />
              <polygon
                points={poly([
                  [l, 0, 0],
                  [l, w, 0],
                  [l, w, h],
                  [l, 0, h],
                ])}
                fill="#75442e"
                stroke="#efba89"
                strokeWidth="1.2"
              />
            </>
          )}
          <polygon
            points={poly([
              [0, 0, plan ? 0 : h],
              [l, 0, plan ? 0 : h],
              [l, w, plan ? 0 : h],
              [0, w, plan ? 0 : h],
            ])}
            fill="#c88b5c"
            stroke="#ffcf9d"
            strokeWidth="1.2"
          />
          <polygon
            points={poly([
              [l * 0.46, 0, plan ? 0 : h + 0.2],
              [l * 0.54, 0, plan ? 0 : h + 0.2],
              [l * 0.54, w, plan ? 0 : h + 0.2],
              [l * 0.46, w, plan ? 0 : h + 0.2],
            ])}
            fill="#d6c3a0"
            opacity=".75"
          />
          {!plan && (
            <path
              d={`M${p(l * 0.46, w, 0)}L${p(l * 0.46, w, h)}M${p(l * 0.54, w, 0)}L${p(l * 0.54, w, h)}`}
              stroke="#d6c3a0"
              strokeWidth="3"
            />
          )}
          <path
            d={`M${p(0, -18)}L${p(l, -18)}M${p(0, -25)}L${p(0, -11)}M${p(l, -25)}L${p(l, -11)}M${p(l + 18, 0)}L${p(l + 18, w)}M${p(l + 11, 0)}L${p(l + 25, 0)}M${p(l + 11, w)}L${p(l + 25, w)}`}
            stroke="#ff9c72"
            fill="none"
            strokeWidth="1.2"
          />
          <text x={lx[0]} y={lx[1] - 12} textAnchor="middle" fill="#ffbb93">
            L {format(l, 0)} CM
          </text>
          <text x={wz[0] + 15} y={wz[1] + 22} fill="#ffbb93">
            W {format(w, 0)} CM
          </text>
          {!plan && (
            <>
              <path
                d={`M${p(-20, w, 0)}L${p(-20, w, h)}M${p(-27, w, 0)}L${p(-13, w, 0)}M${p(-27, w, h)}L${p(-13, w, h)}`}
                stroke="#ff9c72"
              />
              <text
                x={project(-20, w, h / 2)[0] - 12}
                y={project(-20, w, h / 2)[1]}
                textAnchor="end"
                fill="#ffbb93"
              >
                H {format(h, 0)} CM
              </text>
            </>
          )}
        </g>
        <text x="42" y="65" fill="#aab9b4">
          RF / DIMENSIONAL WORKBENCH
        </text>
        <text x="42" y="382" fill="#aab9b4">
          {plan ? "PLAN PROJECTION" : "ORTHOGRAPHIC PROJECTION"} / AUTO FIT
        </text>
        <text x="678" y="382" textAnchor="end" fill="#ffbb93">
          {format(totals.weight, 1)} KG TOTAL
        </text>
      </svg>
      <div className="cargo-study-readout">
        <div>
          <span className="mono">VOLUME</span>
          <strong data-testid="cargo-volume">
            {format(totals.volume, 3)} <small>m³</small>
          </strong>
        </div>
        <div>
          <span className="mono">GROSS WEIGHT</span>
          <strong data-testid="cargo-weight">
            {format(totals.weight, 1)} <small>kg</small>
          </strong>
        </div>
        <div>
          <span className="mono">PIECES</span>
          <strong>{format(totals.pieces, 0)}</strong>
        </div>
      </div>
      <p className="small">
        Illustrative geometry, automatically fitted to view. Totals assume
        identical packages. Blank or invalid measurements use a preview shape;
        complete valid values for the brief.
      </p>
    </div>
  );
}

export function CargoDocuments({
  mode,
  category,
}: {
  mode: string;
  category: string;
}) {
  const document =
    mode === "air"
      ? "Air waybill"
      : mode === "ocean"
        ? "Bill of lading"
        : mode === "land"
          ? "Road consignment note"
          : mode === "warehousing"
            ? "Receiving & inventory instructions"
            : "Transport document for the chosen mode";
  return (
    <div className="cargo-documents">
      <span className="eyebrow">DOCUMENTS TO DISCUSS</span>
      <ul>
        <li>Commercial invoice</li>
        <li>Packing list</li>
        <li>{document}</li>
        {category.startsWith("Dangerous") && (
          <li>Safety data & dangerous goods declaration, as applicable</li>
        )}
        {category === "Food & perishables" && (
          <li>Product certificates & handling instructions, as applicable</li>
        )}
      </ul>
      <p className="small">
        An indicative checklist, not a clearance decision. Requirements depend
        on the goods and jurisdictions.
      </p>
    </div>
  );
}
