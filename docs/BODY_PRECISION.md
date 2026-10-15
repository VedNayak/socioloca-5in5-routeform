# Routeform body equipment revision

16 October 2026. Applies the approved aircraft study's material, mechanical and technical-view direction to the body sections. All hero source, video plates, registered hero geometry, exploded motion and final globe/calculator systems remain unchanged. The quote's dimension-driven workbench and local-only enquiry workflow also remain intact.

## Scene allocation

| Page | Subject | Distinct operation |
|---|---|---|
| Home | Vessel | Ocean passage, propeller, wake and navigation radar |
| Home | Widebody aircraft | Departure, climb and gear retraction |
| Home | Freight tractor | Line haul, rotating wheels and suspension |
| Home | Counterbalance forklift | Receive, lift, carry and lower |
| Home | Inspection conveyor | Pallet travel through a cargo scanner |
| Services | Vessel and quay crane | Suspended spreader traverses and lowers into an empty slot |
| Services | Widebody aircraft | Curved door opens; scissor lift raises and transfers cargo |
| Services | Trailer | Rear doors open; tail lift unloads a pallet, viewed from the rear |
| Services | Reach truck | Raise and reach towards pallet racking |
| Services | Transit case | Hinged inspection lid and handheld verification scanner |
| Industries | Electronics | Individual devices settle into protection before the lid closes |
| Industries | Turboprop | Distinct high-wing model, working propellers and insulated pallet handling |
| Industries | Low-loader | Flanged industrial cargo, lifting crane and tie-down details |
| Industries | Pallet stacker | Stage and raise cargo beside a dispatch conveyor |
| About | Automated shuttle | Index along rails, transfer and return between storage bays |

Shared construction primitives and a coherent material palette are intentional; complete model/action combinations are not repeated across pages. The same widebody airframe has separate departure and apron-loading choreography. Inspection, transit-case and electronics-packing scenes use different cargo geometry and mechanisms. Counterbalance, reach-truck, stacker and automated-shuttle models are distinct.

## Rendering and access

Original Three.js geometry: profiled wings, smooth hulls, recessed engine intakes, instanced fans/ribs, beveled main equipment bodies, fittings, barcode labels, rims, hydraulics, protective packing and cargo handling equipment. Soft contact shadows, generated studio reflections and cool rim lighting replace the flat lighting. Body framing is larger, with a restrained reference floor.

Technical mode scans across registered geometry into sparse edges and translucent surfaces. Every panel has accessible pause, technical-view and camera-reset buttons; keyboard arrows inspect the object. Hover/focus can select a homepage study. Up to three visible body scenes retain stable renderer leases, with a 120px warm-up margin and visible panels prioritised. Pointer movement between the visible trio does not replace their canvases. Rendering is capped at 30fps, suspended on hidden pages and disposed when the scene leaves the active lease. Tiny parts avoid unnecessary rounded geometry and shadows; repeated ribs and fan blades use instancing.

Reduced motion and unavailable graphics use distinct original SVG projections for every study. These are generated locally from the same model compositions, with simple planar proxies for rounded boxes and no external imagery. No paid media generation or third-party equipment models.

## Evidence

`scripts/audit-body-models.mjs` records finite transforms and distinct motion fingerprints in `docs/body-precision-model-audit.json`. `tests/body-precision.spec.ts` checks desktop/mobile working pixels, pause, technical mode, keyboard rotation, no overflow, a bounded three-canvas budget, scene allocation and all static fallbacks. It captures 60 body-study screenshots for visual inspection. Broader regression and deployment results are recorded in QA.md and DEPLOYMENT.md.

Chrome on Windows is the available verified browser for this release. Other browser engines, physical devices and field Core Web Vitals require separate coverage; no claim of universal frame-rate performance is made.
