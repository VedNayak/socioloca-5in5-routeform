# Detailed body equipment QA � 16 October 2026

Build (including TypeScript and five-route prerender), lint and whitespace: Pass on the final source. All 15 scene factories have finite moving transforms and distinct model/action fingerprints. Hero source files are unchanged, verified against Git. No new video/image dependencies or equipment downloads.

Visual: all 15 body studies captured in solid and technical modes at 1440�1000 and 390�844 (60 images). Inspected all six contact sheets and full-size follow-ups. Corrected a slab-like wing, enlarged body framing, then fitted each camera to the complete motion envelope to prevent clipping of lids/forks/racking. Trailer unloading is viewed from the rear. Quay containers use an actual suspended spreader; project cargo follows a hook, cable and slings. Final mobile crane captures were inspected again after the last changes. Complete five-page visual sweeps also pass and refresh 133 viewport screenshots.

Comprehensive Chrome regression: 98 of 99 checks passed in 13.0m. The single failure was the existing strict ship motion pixel check (58 changed pixels; >100 required): the new crane's main action initially started too late. Fixed the production choreography to begin hoisting in the first second; the test was not weakened. Final source also links project cargo to its rigging. All six final targeted checks pass in 2.1m: Services and Industries at desktop/mobile, all 15 fallback resources/scene allocations, and strict ship visible movement/pause/canvas release. Results: body-precision-final-checks.json. The unchanged functionality is covered by the broad run: all five route widths 1440/768/390/320, accessibility, menus/filters/FAQ, honest quote validation/edit/review/download and calculations, heading clipping, actual video-to-geometry registration, reversible hero choreography, scroll markers/workflows, graphics loss and reduced motion.

Browser: Chrome 155.0.8059.40 on Windows. Other browser engines, physical mobile hardware and field Core Web Vitals were not verified in this revision. Rendering is capped at 30fps and leases one body canvas; this is an implementation budget, not a device frame-rate guarantee. The existing Three.js bundle-size warning remains. See BODY_PRECISION.md for architecture/provenance and DEPLOYMENT.md for final live checks.

---

# Final visual pass — 16 October 2026

Pass: visual inspection of all five routes at 1440×1000 and 390×844. Captured 133 viewport screenshots and inspected 27 contact sheets, plus original-size typography, workflow, hero and prototype captures. The Home structural sample was taken after WebGL readiness and at a settled chapter position, rather than the intentional masked entrance boundary.

Fixes: About's 01—05 remains on one line, with its label wrapping as a group; narrow comparison tables have a visible horizontal-scroll cue and thin scrollbar; workflow cues are native text inside the sticky content, below the header, and follow manual stage choices. Desktop/tablet tables that already fit do not show an unnecessary swipe prompt.

The comprehensive Chrome run completed 89 of 90 checks successfully (6.7m). The sole failed assertion incorrectly assumed the 768px table must overflow. The test now measures actual overflow, and the hint's responsive cutoff was narrowed. All four corrected layout checks pass at 320×844, 390×667, 768×1024 and 1440×1000. Both all-route glyph-comparison checks pass on the final build (six targeted checks total, 45.9s). The broad run covers navigation, quote validation/review/download and local-only behaviour, working models, native scroll, hero reversibility/pause, network interactions, reduced motion, graphics fallback, fonts/assets, accessibility and overflow. Build including TypeScript/prerender, lint and whitespace checks pass.

Prototype: exactly one separate aircraft study, with no production replacement. Its actual cargo motion, scrubbing, technical mode, orbit, responsive bounds and browser/WebGL console were tested; detailed result in docs/aircraft-study-checks.json. Bundled locally with real fonts and retained MIT/OFL notices; no external assets or media-generation charges. The self-contained fragment is below 1 MB.

Browser: installed Chrome 155.0.8059.40 on Windows. Other browser engines, physical mobile devices and field Core Web Vitals remain not checked in this revision. Mobile coverage uses responsive viewports; no physical-device claim. See deployment documentation for live verification.

---

# Typography clearance — 15 October 2026

Build including TypeScript/prerender, lint and whitespace: Pass. Targeted Chrome checks verify the orange glyph sweep, all-five-route editorial entrances/reduced-motion restoration, journey layout/accessibility at 1440/768/390/320px, narrow Home actions and each internal film/poster framing on desktop/mobile. New pixel checks compare representative headings on every route plus the exact About disclosure against unclipped masks and native font ink at 1440/390px; no lost solid strokes or page overflow. The disclosure's section margin is preserved (40px desktop, 30px mobile); screenshots captured and visually inspected at both widths.

During verification, an expanded clipping-path approach let the decorative sweep enlarge the scrollable page. Replaced with overflow containment and explicit glyph padding. The native-ink comparison allows browser antialiasing differences; the mask-only comparison remains strict. A spacing assertion was corrected to follow the existing responsive margin rather than imposing the desktop minimum on mobile.

Other browsers, physical devices and field Core Web Vitals were not tested in this revision. No fonts, media, 3D geometry, quote logic or source-company files were changed. Both live glyph-comparison checks pass at 1440/390px (28.3s), covering representative headings on all five routes and the reported About section. All five live routes/assets/metadata/headers/404 pass with zero broken images or unexpected console errors. An initial concurrent live-smoke page-load timeout cleared on a sequential retry. Release details: docs/DEPLOYMENT.md.

---

# Home-scale globes / dotted calculator — 15 October 2026

Pass: build, TypeScript, lint and whitespace checks. Eleven targeted Chrome checks passed (1.7m): coherent calculator point groups/animated keypad; bounded geographic dots and moving transport markers; desktop/mobile screenshots of all four internal endings; each route's reversible registered model → separated structure → transient field → finished formation sequence, including pause/resume; text/control clearance at 320×844, 390×667 and 768×1024. Captured Home's actual finished scene at 1440×1000 and 390×844 for comparison; inspected Home, Services, Industries and Quote desktop screenshots and Services/Quote mobile screenshots. The desktop globe diameter now follows Home's camera ratio; mobile fitting preserves copy and controls. Quote's display is illustrative, not a freight rate or submitted enquiry.

The final 1920×1080 four-page screenshot check passed (20.9s); Services and Quote widescreen captures inspected. All five deployed routes/assets/404/headers pass. Normal-motion live Services and Quote endpoint identities are verified with zero console errors, and browser-fetched renderer SHA-256 matches the tested build exactly (docs/live-home-scale-scenes.json). Cross-browser/physical-device coverage and field Core Web Vitals were not measured in this revision. Home renderer source and quote form implementation were not changed.

---

# Geographic globe endings — 15 October 2026

Build (including TypeScript and five-route prerender), lint and whitespace checks pass. Twenty-three targeted Chrome checks pass: geographic point buffers/route marker movement; four-page desktop and mobile screenshots; distinct internal openings; body models and keyboard/context recovery; native workflow scrolling; reduced motion; all four reversible assembly/burst/globe sequences and pause/resume; mobile clearance at 320x844, 390x667 and 768x1024. Desktop 1440x1000 and mobile 390x844 screenshots captured for all four internal pages; Services desktop, Industries mobile and About desktop visually inspected. Home renderer remains unchanged.

An initial overlapping pair of test runners collided in their shared trace-artifact directory. The sequential final runner completed all 23 checks without that artifact collision. Browsers other than installed Chrome and physical devices were not tested in this revision. Existing quote/backend limitations remain: local-only demonstration, no enquiry transmission. Additional About sea-waypoint refinements passed two follow-up checks before release. After deployment, both desktop/mobile globe preview checks pass against the live Worker. All five live routes/assets/404/headers pass with zero broken images or unexpected console errors. Browser-fetched renderer and application bundle SHA-256 values exactly match the tested build (docs/live-geographic-assets.json).

---

# Routeform release verification

Build, TypeScript and lint pass. Chrome regression: 68/70 initial cases pass; the two failures expected old source-business location text or empty measurements. Tests were updated to assert the fictional node and explicitly clear the prefilled weight before testing validation. Both rechecks pass (17.4s); no application changes were required. All 70 cases are resolved.

Coverage: five routes at 1440/768/390/320px, asset decode and reload, mobile/mega navigation, keyboard/touch targets, filters, FAQs, network controls, scroll stages, working object motion and pause, internal film framing, particles, component separation/reformation, graphics-loss fallback, reduced motion and no phone films. All five page accessibility audits pass. New workbench tests cover dimensional conversion, visible geometry updates, plan view, document updates, final-review revalidation, disabled completed values and no real-business identity/contact links. Full quote edits, validation, consent, download and no-transmission flow pass.

Local screenshots were captured and visually inspected: docs/screenshots/quote-desktop.png, quote-mobile.png, home-desktop.png. Screenshots are ignored local QA artefacts.

Only installed Chrome was verified on this Windows host. Other engines, physical devices and field Core Web Vitals are not asserted. No historical source-site test results are counted toward this release.

Quote page Lighthouse production-preview lab: desktop LCP 0.47s, TBT 12ms, CLS <0.001; mobile LCP 2.19s, TBT 76ms, CLS 0.007. Reports are local lab results, not field measurements or INP. No other page performance claim is inferred. Detailed reports and summary are committed.

Initial separate live deployment: all five HTTPS pages return 200 with decoded images, correct titles, CSP and noindex headers; unknown routes return 404; no unexpected console errors. Eight live Chrome checks pass (1.3m): all four internal poster/film handoffs on desktop/mobile, full quote edit/validation/download flow, dimensional workbench, final-review revalidation and five-page fictional identity. Final review also replaced a remaining geographic foundation caption with the Routeform positioning.

## Editorial/icons/colour sweep revision — 15 October 2026

Seven new cases verify the actual intermediate glyph-sweep phase and final base state, five distinct stage geometries and finite GSAP completions, reduced-motion cleanup, four viewport icon/copy non-overlap and accessibility, and settled heading/reduced-motion cleanup on all five routes. Existing 40-case targeted regression: 39 initial passes; one transient contrast failure corrected by removing text/panel opacity dips. The final 16-case subset passes, including all seven new tests, service objects/contrast, all five page accessibility audits, network controls, full quote workflow and normal-motion navigation cleanup. All 47 unique targeted cases resolved. No older full-suite total is claimed as a fresh run. Build, TypeScript, lint and whitespace checks pass.

Desktop five-stage contact sheet and mobile panel were captured and inspected under docs/screenshots (ignored local artefacts). Original hero renderer assets are unchanged. Other browser engines, physical devices and field performance were not rerun.

Live editorial release: all five HTTPS routes, decoded images, useful 404, CSP/noindex headers and zero unexpected console errors pass. Three live Chrome motion checks pass (37.7s), including the actual intermediate colour phase, five icon actions and all-route reduced-motion cleanup. Exact served source verified in editorial-live-bundle.json. Actual intermediate colour-band screenshot captured and visually inspected.

## Clean hero endings — 15 October 2026

14 targeted Chrome checks pass (3.5m): geometry finiteness/bounds/no point-cloud objects; four original registered poster/film handoffs; pointer/graphics fallback and reduced-motion/mobile film behaviour; all four separation/clean-form/reversal/pause sequences; three mobile/tablet viewport cases each testing all four forms for visible geometry clearing copy and controls. Final opacity is asserted to be 0.000 at .96 scroll progress. Existing screenshot difference thresholds remain intact; only the intended endpoint descriptions/identities are updated. Desktop contact sheet captured and visually inspected. A final desktop-only About offset adjustment is being rebuilt/rechecked. Home geometry source is unchanged.

Final About spacing rebuild and lint pass. About clean-form/reversal/pause recheck and Home’s unchanged cinematic/globe desktop/mobile/reduced-motion regression both pass (39.4s). Updated four-page contact sheet and full About ending captured and visually inspected. No additional application changes followed these checks.

Live clean-form release: all five routes/assets/404/security headers and zero unexpected console errors pass. All four endpoint identities and zero particle opacity verified in live-clean-formations.json; exact served renderer SHA matches local build. A separate live mobile last-chapter-button check reaches progress .900 with the modular cube, zero particle opacity and fully visible final copy. Mobile live screenshot captured and inspected.

Live verification (2026-10-16): all five deployed routes/assets/404/security headers passed with zero console errors after propagation; all four final-layout tests passed against the deployed Worker at 320, 390, 768 and 1440px. The initial propagation-time stylesheet failure was resolved on complete retry.
