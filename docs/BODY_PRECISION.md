

Body continuity details: removed the inherited preview-only hover zoom; generated Home aircraft/truck rest frames at their distinct 1.12/1.3 housing ratios. The ship deck was coplanar with the beveled hull cap; it is now raised to remove depth-buffer flicker. Both ship SVGs/rest frames were regenerated and the 15-model audit passes. Pixel checks pause the operation before initial activation so they compare the first pose rather than a later, legitimately moving frame; the original mean-difference threshold remains unchanged. Offscreen re-entry checks compare both pixels and operation time. Development-server reloads invalidated an early run; release checks use the production build. Chrome on Windows is the verified browser; other engines, physical devices and field CWV were not checked in this focused fix.
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

Technical mode scans across registered geometry into sparse edges and translucent surfaces. Every panel has accessible pause, technical-view and camera-reset buttons; keyboard arrows inspect the object. Hover/focus can select a homepage study. Up to three visible body scenes retain stable renderer leases, with a viewport-ahead warm-up margin and visible panels prioritised. Pointer movement between the visible trio does not replace their canvases. Rendering is capped at 30fps, suspended on hidden pages and disposed when the scene leaves the active lease. Tiny parts avoid unnecessary rounded geometry and shadows; repeated ribs and fan blades use instancing.

Reduced motion and unavailable graphics use distinct original SVG projections for every study. These are generated locally from the same model compositions, with simple planar proxies for rounded boxes and no external imagery. No paid media generation or third-party equipment models.

## Evidence

`scripts/audit-body-models.mjs` records finite transforms and distinct motion fingerprints in `docs/body-precision-model-audit.json`. `tests/body-precision.spec.ts` checks desktop/mobile working pixels, pause, technical mode, keyboard rotation, no overflow, a bounded three-canvas budget, scene allocation and all static fallbacks. It captures 60 body-study screenshots for visual inspection. Broader regression and deployment results are recorded in QA.md and DEPLOYMENT.md.

Chrome on Windows is the available verified browser for this release. Other browser engines, physical devices and field Core Web Vitals require separate coverage; no claim of universal frame-rate performance is made.


Static/live continuity: compact/wide WebGL rest frames are generated with scripts/prepare-body-posters.mjs (local Vite server on port 4175). Suspension captures the actual lit frame and retains operation/camera/technical state for re-entry; first-frame elapsed time is zero. Tests in body-reentry.spec.ts compare actual pixels before/after suspension and static/live entry across all studies at 1440/390px. The interactive geometry remains the default.

First-entry image comparison pauses the real controls at mount. A 1.2px blur normalises subpixel rasterisation of scaled WebP vs native WebGL; the mean colour/shape threshold remains 3/255. Re-entry pixel checks use no blur and retain the 1.5/255 bound. Interface controls, operation time, motion and accessibility have separate assertions.
