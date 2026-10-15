import { useId, useState } from "react";
import { geoNaturalEarth1, geoPath, geoInterpolate } from "d3-geo";
import { ArrowUpRight, Pause, Play } from "lucide-react";
import { Link } from "react-router-dom";

const projection = geoNaturalEarth1().scale(183).translate([565, 298]);
const path = geoPath(projection);
const places = [
  {
    name: "Dubai",
    code: "DXB",
    coord: [55.27, 25.2] as [number, number],
    detail: "Illustrative interchange · no real office",
  },
  {
    name: "Hong Kong",
    code: "HKG",
    coord: [114.16, 22.3] as [number, number],
    detail: "Illustrative origin · no real office",
  },
  {
    name: "Rotterdam",
    code: "RTM",
    coord: [4.48, 51.92] as [number, number],
    detail: "Illustrative origin · no real Routeform office",
  },
  {
    name: "Mumbai",
    code: "BOM",
    coord: [72.87, 19.08] as [number, number],
    detail: "Illustrative origin · no real Routeform office",
  },
  {
    name: "Riyadh",
    code: "RUH",
    coord: [46.68, 24.71] as [number, number],
    detail: "Illustrative destination · no real Routeform office",
  },
];
const airInterpolation = geoInterpolate(places[1].coord, places[0].coord);
const lanes = [
  {
    name: "Hong Kong → Dubai",
    mode: "Ocean freight",
    kind: "ocean",
    cargo: "Consolidated general cargo",
    coordinates: [
      [114.16, 22.3],
      [114.5, 19],
      [110, 12],
      [105, 4],
      [103.5, 1],
      [96, 5],
      [84, 5],
      [78, 7],
      [65, 17],
      [59.5, 24],
      [57, 26],
      [56.6, 26.7],
      [55.27, 25.2],
    ],
  },
  {
    name: "Rotterdam → Dubai",
    mode: "Ocean freight",
    kind: "ocean",
    cargo: "Containerised trade goods",
    coordinates: [
      [4.48, 51.92],
      [2, 51.2],
      [-1, 50.2],
      [-5.5, 49.3],
      [-8, 47],
      [-11, 37],
      [-5.6, 35.9],
      [9, 37],
      [20, 35],
      [32.4, 31.3],
      [32.55, 30],
      [33, 28],
      [38, 20],
      [43.3, 12.5],
      [52, 13],
      [59.5, 24],
      [57, 26],
      [56.6, 26.7],
      [55.27, 25.2],
    ],
  },
  {
    name: "Hong Kong → Dubai",
    mode: "Air freight",
    kind: "air",
    cargo: "Time-sensitive electronics",
    coordinates: Array.from({ length: 50 }, (_, i) => airInterpolation(i / 49)),
  },
  {
    name: "Mumbai → Dubai",
    mode: "Ocean freight",
    kind: "ocean",
    cargo: "General cargo consolidation",
    coordinates: [
      [72.87, 19.08],
      [70, 18],
      [65, 19],
      [59.5, 24],
      [57, 26],
      [56.6, 26.7],
      [55.27, 25.2],
    ],
  },
  {
    name: "Dubai → Riyadh",
    mode: "Land transport",
    kind: "land",
    cargo: "Palletised regional distribution",
    coordinates: [
      [55.27, 25.2],
      [54.38, 24.45],
      [52, 23.6],
      [50.8, 24.2],
      [48.8, 24.4],
      [46.68, 24.71],
    ],
  },
];

export default function Network() {
  const [filter, setFilter] = useState("all");
  const [active, setActive] = useState(0);
  const [node, setNode] = useState(0);
  const [paused, setPaused] = useState(false);
  const uid = useId().replace(/:/g, "");
  const selected = lanes[active];
  return (
    <section
      className="network dark section"
      id="network"
      aria-labelledby="network-title"
    >
      <div className="section-heading reveal">
        <div>
          <span className="eyebrow">02 / A WORLD OF CONNECTIONS</span>
          <h2 id="network-title">
            Local understanding.
            <br />
            Global perspective.
          </h2>
        </div>
        <p>
          Connecting cargo starts with understanding what happens at each end.
          Explore how different modes bring a shipment together.
        </p>
      </div>
      <div className={`map-shell reveal ${paused ? "is-paused" : ""}`}>
        <div className="map-top">
          <span className="mono">
            <span className="status-dot" /> ROUTE EXPLORER
          </span>
          <button
            className="text-button"
            onClick={() => setPaused(!paused)}
            aria-pressed={paused}
          >
            {paused ? <Play size={14} /> : <Pause size={14} />}{" "}
            {paused ? "Resume" : "Pause"} motion
          </button>
        </div>
        <div className="map-layout">
          <div className="map-canvas">
            <svg
              viewBox="0 0 1130 570"
              role="img"
              aria-label="World map with illustrative cargo routes connecting Dubai, Hong Kong, Rotterdam, Mumbai and Riyadh"
            >
              <image href="/images/world-map.svg" width="1130" height="570" />
              {lanes.map((lane, i) => {
                if (filter !== "all" && lane.kind !== filter) return null;
                const d =
                  path({ type: "LineString", coordinates: lane.coordinates }) ||
                  "";
                return (
                  <g key={i} className={i === active ? "lane active" : "lane"}>
                    <path
                      id={`${uid}-route-${i}`}
                      d={d}
                      className="route-path"
                    />
                    {!paused && (
                      <circle
                        r={i === active ? 4 : 2.5}
                        className="shipment-dot"
                      >
                        <animateMotion
                          dur={`${10 + i * 2}s`}
                          begin={`${-i * 3}s`}
                          repeatCount="indefinite"
                        >
                          <mpath href={`#${uid}-route-${i}`} />
                        </animateMotion>
                      </circle>
                    )}
                  </g>
                );
              })}
              {places.map((place, i) => {
                const [x, y] = projection(place.coord)!;
                return (
                  <g
                    key={place.name}
                    transform={`translate(${x} ${y})`}
                    className={`map-node ${i === node ? "selected" : ""}`}
                  >
                    <circle r={i === 0 ? 13 : 8} className="node-ring" />
                    <circle r={i === 0 ? 5 : 3} className="node-dot" />
                    <text
                      x={i === 3 ? 14 : i === 4 ? -12 : i === 0 ? 10 : 0}
                      y={i === 3 ? 10 : i === 4 ? 20 : -18}
                      textAnchor={
                        i === 3 || i === 0
                          ? "start"
                          : i === 4
                            ? "end"
                            : "middle"
                      }
                    >
                      {place.name.toUpperCase()}
                    </text>
                  </g>
                );
              })}
              <text x="50" y="465" className="ocean-label">
                ATLANTIC OCEAN
              </text>
              <text x="645" y="430" className="ocean-label">
                INDIAN OCEAN
              </text>
              <text x="900" y="335" className="ocean-label">
                PACIFIC OCEAN
              </text>
            </svg>
            <div className="map-places" aria-label="Explore locations">
              {places.map((place, i) => (
                <button
                  key={place.name}
                  onClick={() => setNode(i)}
                  aria-pressed={node === i}
                >
                  {place.code}
                  <span>{place.name}</span>
                </button>
              ))}
            </div>
            <p className="node-detail" aria-live="polite">
              {places[node].detail}
            </p>
          </div>
          <aside className="route-panel">
            <span className="eyebrow">ILLUSTRATIVE SHIPMENT</span>
            <span className="route-id mono">
              CONCEPT / {String(active + 1).padStart(3, "0")}
            </span>
            <h3>{selected.name}</h3>
            <div className="shipment-info">
              <span>Transport mode</span>
              <strong>{selected.mode}</strong>
              <span>Cargo example</span>
              <strong>{selected.cargo}</strong>
            </div>
            <div className="route-progress">
              <span />
              <span />
              <span />
            </div>
            <p>
              Sample movement shown for exploration. No live tracking, transit
              promise or confirmed company lane.
            </p>
            <Link to={`/quote?mode=${selected.kind}`} className="inline-link">
              Plan a similar shipment <ArrowUpRight size={18} />
            </Link>
          </aside>
        </div>
        <div className="map-bottom">
          <div className="filter-tabs" aria-label="Filter transport modes">
            {["all", "ocean", "air", "land"].map((f) => (
              <button
                key={f}
                aria-pressed={filter === f}
                onClick={() => {
                  setFilter(f);
                  setActive(
                    f === "all" ? 0 : lanes.findIndex((l) => l.kind === f),
                  );
                }}
              >
                {f === "all"
                  ? "All routes"
                  : f === "land"
                    ? "Land"
                    : f[0].toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
          <span className="mono muted">
            DEMONSTRATION DATA / NOT LIVE TRACKING
          </span>
        </div>
        <div
          className="lane-selector"
          aria-label="Select an illustrative route"
        >
          {lanes.map(
            (lane, i) =>
              (filter === "all" || lane.kind === filter) && (
                <button
                  key={i}
                  onClick={() => setActive(i)}
                  aria-pressed={active === i}
                >
                  {lane.name}
                  <span>{lane.mode}</span>
                  <ArrowUpRight size={14} />
                </button>
              ),
          )}
        </div>
      </div>
      <p className="section-note">
        Routes are geographically informed illustrations, not bookable
        itineraries. All cities are illustrative nodes, not real company
        locations.
      </p>
    </section>
  );
}
