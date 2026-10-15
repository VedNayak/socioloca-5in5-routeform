import type { VehicleKind } from "./vehicles";
export type BodyStudy =
  | "home-port"
  | "home-air"
  | "home-road"
  | "home-warehouse"
  | "home-electronics"
  | "services-port"
  | "services-air"
  | "services-road"
  | "services-warehouse"
  | "services-electronics"
  | "industries-electronics"
  | "industries-food"
  | "industries-industrial"
  | "industries-warehouse"
  | "about-warehouse";
export const bodyStudies: Record<
  BodyStudy,
  { kind: VehicleKind; title: string; action: string }
> = {
  "home-port": {
    kind: "ship",
    title: "Feeder vessel / ocean passage",
    action: "Propulsion, wake, navigation",
  },
  "home-air": {
    kind: "plane",
    title: "Widebody / departure",
    action: "Rotate, retract, climb",
  },
  "home-road": {
    kind: "truck",
    title: "Freight tractor / line haul",
    action: "Drive, steer, suspension",
  },
  "home-warehouse": {
    kind: "forklift",
    title: "Counterbalance / receiving",
    action: "Lift, carry, lower",
  },
  "home-electronics": {
    kind: "crate",
    title: "Cargo / inspection line",
    action: "Convey, scan, release",
  },
  "services-port": {
    kind: "ship",
    title: "Container vessel / quay transfer",
    action: "Hoist, traverse, stow",
  },
  "services-air": {
    kind: "plane",
    title: "Widebody / apron loading",
    action: "Open, elevate, transfer",
  },
  "services-road": {
    kind: "truck",
    title: "Tractor trailer / unloading",
    action: "Open, deploy, unload",
  },
  "services-warehouse": {
    kind: "forklift",
    title: "Reach truck / rack put-away",
    action: "Raise, reach, place",
  },
  "services-electronics": {
    kind: "crate",
    title: "Transit case / release inspection",
    action: "Unlatch, open, verify",
  },
  "industries-electronics": {
    kind: "crate",
    title: "Electronics / protective packing",
    action: "Nest, cushion, secure",
  },
  "industries-food": {
    kind: "plane",
    title: "Turboprop / cold-chain handling",
    action: "Propellers, insulated cargo",
  },
  "industries-industrial": {
    kind: "truck",
    title: "Low-loader / project cargo",
    action: "Slew, lower, secure",
  },
  "industries-warehouse": {
    kind: "forklift",
    title: "Pallet stacker / dispatch",
    action: "Stage, lift, release",
  },
  "about-warehouse": {
    kind: "forklift",
    title: "Automated shuttle / coordination",
    action: "Index, transfer, return",
  },
};
