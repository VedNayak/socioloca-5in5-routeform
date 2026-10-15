# Routeform — final visual pass

16 October 2026. Reviewed all five pages at desktop 1440×1000 and mobile 390×844, including opening/structural/final hero states, page sections, workflow endpoints, quote workbench and footers. Captured 133 viewport images and inspected all 27 contact sheets, with full-size follow-ups. No remaining settled-heading clipping observed. Fixed the About 01—05 range wrapping onto two lines, added a comparison-table horizontal-scroll hint at narrow widths, and moved workflow scroll cues inside their sticky panels so the header cannot cover them. Manual stage selection now updates the visible count directly from React state. Existing aircraft and other production 3D assets are preserved.

A single independent aircraft study was created for review in the conversation: a more detailed airframe, flush glazing, profiled wings, recessed engine fans, cargo door/lift/pallet action, and a registered spatial solid-to-wireframe scan. It is self-contained, uses the real brand fonts, and is separate from the deployed application. No new paid media generation.

Build/typecheck/lint and visual regression evidence: docs/QA.md. Release target and live verification: docs/DEPLOYMENT.md. SASCO remains untouched.

---

# Routeform — typography clearance

15 October 2026. Shared word and hero masks now reserve font-relative space above, below and beside glyphs. Gradient-filled words have their own expanded paint area. Heading wrappers retain horizontal containment for the orange sweep, with explicit glyph padding, and no longer override each section's bottom margin. The About disclosure regains its intended 40px desktop / 30px mobile separation from the following grid. Hero leading is adjusted to maintain readable lines with the safer reveal masks. All five pages retain their original fonts, colour sweeps and reveal choreography.

Validation and live release details: docs/QA.md and docs/DEPLOYMENT.md. Original SASCO remains untouched.

---

# Routeform — Home-scale globes and dotted calculator

15 October 2026. Internal final globes now match the accepted Home geographic viewing angle, three faint reference rings, dot density/treatment and desktop visible diameter. The camera framing is derived from Home's 8.4-unit globe, 13.8-unit lens and 1536×1024 plate aspect rather than padded route bounds. At 1440×1000 the globe diameter is approximately 609px, up from approximately 368px. Services and About sit opposite their left editorial columns; Industries mirrors the composition. Mobile retains safe fitting between copy and controls, with 6,500 dots as on Home.

Quote ends in an original dotted 3D calculator: rounded layered chassis, seven-segment illustrative display, raised numeric/operator keys and a subtle orange key-press cycle. Its point geometry is also the convergence target for the existing assembly particles. It depicts a planning calculation, not a freight rate. Opening plates, wireframe/exploded stages, scroll cues and real quote workbench remain in place. Home renderer source and SASCO are unchanged. Fresh validation/deployment details: docs/QA.md and docs/DEPLOYMENT.md.

---

# Routeform — geographic globe endings

15 October 2026. Supersedes the abstract line-form iteration below. All four internal openings now resolve into geographic dotted globes using the same local Natural Earth land mask, dot shading and restrained orange accents as the accepted Home. Services adds original aircraft silhouettes that follow spherical flight arcs and orient to each path tangent. About uses explicit ocean waypoints for illustrative connections. Industries and Quote use quieter connecting routes. Existing registered plates, wireframes, separated components, distinct page openings and Home renderer are preserved.

Internal hero footers now show an explicit scroll instruction and progress rail, changing to a continuation prompt at the final chapter. Workflow sequences show the active stage count and a continuation cue; reduced motion retains manual selection. Body models indicate scroll assembly and drag inspection. Routes are illustrative, not operating-lane claims. No new paid media.

Validation and deployment results are recorded in docs/QA.md and docs/DEPLOYMENT.md.

---

# Routeform — clean internal hero endings

15 October 2026. Final internal hero frames now resolve into sparse original 3D line forms: Services orbital sphere, Industries modular cube, About navigation ring/core, Quote dimension cuboid. The detailed particle vehicles, floor grids, racking and long environment paths are removed from the endpoint. Particles converge to the form and fade completely by progress .86; their draw object is then hidden. The accepted plate, wireframes, component separation and Home globe source remain unchanged.

Final build/TypeScript/lint/whitespace: Pass. Fourteen targeted Chrome checks pass (3.5m): bounded original line geometry, four registered film/poster handoffs at desktop/mobile, particle pointer/graphics fallback, reduced-motion/no-phone-film behaviour, four reversible separation/burst/clean-form sequences with zero endpoint particle opacity, and all four forms clearing text/controls at 320x844, 390x667 and 768x1024. A 1440px four-page contact sheet was captured and inspected; About’s ring was shifted farther from its copy. Final About spacing and reversal recheck pass; the unchanged Home cinematic/globe desktop/mobile/reduced-motion regression also passes (two final checks, 39.4s). Updated desktop sheet captured and inspected. Deployed to the Routeform Worker from 7cf6d12f7fab48dd78eba30add5f9447df1d152f; version 0a97d7e2-758a-4600-a14e-309d11f3d5b6. All five live routes/assets/404/security headers pass with zero console errors. All four live endpoint identities and zero particle opacity verified; served renderer bytes match the local build. The actual last-chapter button also reaches the clean cube and fully visible copy at 390px.

No new media, dependencies or paid generation. Other browsers/physical devices/field performance were not rerun. The source company repository and Worker remain untouched. [Architecture](docs/CLEAN_HERO_ENDINGS.md).

---

## Previous editorial motion release

# Routeform — journey icons and editorial colour sweep

15 October 2026. Five original animated workflow icons replace the repeated box on Home and Services. Each stage has its own finite GSAP action and a visible mobile layout. All five pages gain coordinated line/word masks, technical labels, section rules, shaped panel entrances and a moving orange/warm-white band inside the heading glyphs. The sweep aligns across words/lines, recalculates on resize and resolves to the base text colour. Reduced motion restores unsplit static text and static icons; forced colours use normal text. Existing hero renderers and quote functionality remain unchanged.

Build / TypeScript / lint / whitespace: Pass. Targeted Chrome QA: 47 unique checks resolved, comprising seven new editorial/icon checks and 40 existing navigation, route, motion, accessibility and quote checks. The broad run found one transient contrast issue; text and panel opacity dips were removed, and the final 16-case sweep/accessibility/route/quote subset passes (1.7m). Four widths (1440/768/390/320px) have no journey icon/copy overlap. Actual five-stage desktop and mobile panels captured and visually inspected.

Deployed successfully to the Routeform Worker from 358b5638d2e9d01469a7920ec5c352e73665f08f; version feb38380-c6b5-479b-bd4e-de57833b17e4. All five live pages/assets/404/security headers pass, with no console errors. Three live motion checks pass (37.7s): actual glyph sweep, all five icon actions and editorial/reduced-motion cleanup across all five pages. Exact served bundle matches local output. Chrome on Windows verified; other engines and physical devices were not rerun. No field-performance claim. No new media, assets from the reference, dependencies or media spend. The source company repository and Worker remain untouched.

[Motion architecture](docs/EDITORIAL_MOTION.md).

---

## Previous fictional-brand release

# Routeform — fictional logistics showcase

15 October 2026. Five complete routes: /, /services/, /industries/, /about/, /quote/. Independent Git history, repository and Cloudflare Worker. The source company project remains unchanged at 9b071dbfd3a84526bd1431cd7743dd15bf0eca6c.

Original Routeform R monogram, fictional cargo-first positioning, independent About/operating model, new metadata and disclosures. All real-business locations, history, contacts and outbound enquiry links are removed. Cities, service models and scenarios are explicitly illustrative.

Existing unique cinematic openings, GSAP scroll choreography, registered wire geometry, exploded assemblies, particles and working body subjects are retained. The quote workbench adds original dimension-driven spatial/plan geometry, identical-piece volume and gross-weight totals, a mode/cargo-aware document checklist, accessible controls and final-review revalidation. Review, consent, brief download and clear no-transmission confirmation are preserved. No new paid media.

| Area | Status | Evidence / limit |
| --- | --- | --- |
| Five pages and responsive layout | Pass | All five routes at 1440, 768, 390 and 320px; direct route refresh and decoded images |
| Functional and motion QA | Pass | 70 Chrome regression cases resolved: 68 initial passes, two source-brand/default-data assertions updated and both rechecked successfully |
| Accessibility essentials | Pass | Automated audits on all five pages, keyboard navigation and reduced-motion tests; no claim of independent conformance certification |
| Engineering | Pass | Build, TypeScript, lint, prerender, staged whitespace checks |
| Visual review | Pass (internal) | Captured and inspected desktop/home and desktop/mobile workbench screenshots; user acceptance not inferred |
| Performance | Pass (quote lab) | Desktop LCP 0.47s / CLS <0.001; mobile LCP 2.19s / CLS 0.007; local production lab, field CWV unavailable |
| Browsers / devices | Partial | Installed Chrome on Windows; other engines and physical devices not verified |
| Deployment | Pass | Separate Routeform Worker live; all five HTTPS routes, assets, CSP/noindex, useful 404 and eight live functional/video checks pass. Final exact bundle and identity verified |

[Concept direction](docs/CONCEPT_DIRECTION.md) · [QA](docs/QA.md) · [Asset provenance](ASSET_MANIFEST.md).

Deployed source: 6f750a17ac40c126238d6464f0f7ed41875622e3. Worker version: 76193c5c-8113-4293-ad22-b7de1452993f. Preview: https://socioloca-5in5-routeform.ved-593.workers.dev/ . GitHub: https://github.com/VedNayak/socioloca-5in5-routeform . Final caption verified at 1440/768/390/320px; exact served main bundle matches the local build. Follow-up documentation commits do not change deployed application code.
