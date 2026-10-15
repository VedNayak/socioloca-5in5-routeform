# Routeform — journey icons and editorial colour sweep

15 October 2026. Five original animated workflow icons replace the repeated box on Home and Services. Each stage has its own finite GSAP action and a visible mobile layout. All five pages gain coordinated line/word masks, technical labels, section rules, shaped panel entrances and a moving orange/warm-white band inside the heading glyphs. The sweep aligns across words/lines, recalculates on resize and resolves to the base text colour. Reduced motion restores unsplit static text and static icons; forced colours use normal text. Existing hero renderers and quote functionality remain unchanged.

Build / TypeScript / lint / whitespace: Pass. Targeted Chrome QA: 47 unique checks resolved, comprising seven new editorial/icon checks and 40 existing navigation, route, motion, accessibility and quote checks. The broad run found one transient contrast issue; text and panel opacity dips were removed, and the final 16-case sweep/accessibility/route/quote subset passes (1.7m). Four widths (1440/768/390/320px) have no journey icon/copy overlap. Actual five-stage desktop and mobile panels captured and visually inspected.

Deployment pending. Chrome on Windows verified; other engines and physical devices were not rerun. No field-performance claim. No new media, assets from the reference, dependencies or media spend. The source company repository and Worker remain untouched.

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
