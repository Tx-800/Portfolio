# TODO / Build Plan

At the end of each phase (or sub-step), tick the boxes, list the files, commands and what to check (desktop + mobile), then **stop for approval**.
Legend: `[ ]` todo · `[x]` done · `[~]` partial

**Current: mobile "pinned stage" redesign + font change done, awaiting review before Phase 7**

---

## Phase 1: Setup + content
### (a) Setup, content, Classic View
- [x] Update docs for the "Follow the Data" brief
- [x] Scaffold Next.js 16 + TS + Tailwind v4 + ESLint (`src/`, `@/*`). React 19.3.x, TypeScript 6
- [x] Deps: lucide-react, clsx, tailwind-merge
- [x] Design tokens in `globals.css` (`@theme`), fonts (Space Grotesk, Inter, JetBrains Mono)
- [x] `src/lib/site.ts` (`SITE_URL`, single place for the domain), `src/lib/utils.ts`
- [x] `src/data/content.ts`: profile, chapters, 9 projects + case studies, metrics, skills, experience, contact
- [x] UI: Header, Footer, Container, ChapterLabel, Button, StatusBadge, ProjectCard, MetricCounter, Timeline, Txt (placeholder highlighter), brand icons
- [x] `/classic`: complete, polished
- [x] Base metadata, `not-found.tsx` placeholder, temporary `/`
### (a+) Solar Plasma design system
- [x] Tokens, gradients, glows, shadows in `globals.css`. Contrast verified (UIUX §2)
- [x] Fonts: Syne / Inter / IBM Plex Mono. Wordmark "yogesh*". "Let's talk" CTA
- [x] Placeholders as mono + dashed underline (no colour)
- [x] Content: verified OVI/Masstech tech, restored project dates, job title → placeholder
### (b) Chapter panels + case studies
- [x] `src/components/sections/*`: 10 chapter sections as HTML panels on `/`
- [x] `CaseStudy` component + `/work/[slug]` (static params, metadata, sticky TOC, diagrams/screenshot placeholders)
- **Check:** `/`, `/classic`, `/work/localpilot` at 360 / 390 / 768 / 1280 · Tab through · `npm run build` + `npm run lint`

## Phase 2: Scroll engine
- [x] lenis + gsap/ScrollTrigger + @gsap/react + zustand (+ three for the path math)
- [x] `store/journey.ts` (progress, pathT, activeIndex, holding). Lenis ↔ ScrollTrigger sync on `gsap.ticker` (`ScrollEngine`)
- [x] Hold zones: `lib/scrollMap.ts` (focus line, keyframes, eased travel) + `ChapterTransit` gaps (commented)
- [x] ChapterNav: desktop rail at xl+ (chapters 1–9), bottom bar + `<dialog>` sheet below xl. One delegated anchor handler (smooth scroll + focus)
- [x] Placeholder packet moving along the real CatmullRom path: `/?debug`
- [~] Reduced motion → no Lenis, transits collapse (classic-style layout in place). No-WebGL detection comes with the canvas (Phase 3/6)
- **Check:** `/?debug` on desktop + mobile. The packet holds while a panel is readable and travels in the gaps. Rail/bar highlight follows; links jump + focus

## Phase 3: 3D world part 1
- [x] Fixed Canvas (dynamic, ssr:false, mounted on idle after first paint, fades in), `Experience.tsx`, `CameraRig.tsx`, `path.ts`
- [x] Packet (gradient shader + halos + travelling light) + stations 1–4 (procedural, `<Station>` wrapper ready for .glb), near-camera activation
- [x] Tiers (high/low + PerformanceMonitor fallback), pause when the tab is hidden, no-WebGL fallback
- [x] Bloom + ACES tone mapping + vignette (high tier), lightformer environment, camera-following fog (pulled forward from Phase 6 at the owner's request)
- [x] Mobile: panels in the lower part, station framed above. Verified with headless screenshots (desktop 1440×900, mobile 390×844)

## Phase 4: 3D world part 2
- [x] Stations 5–9: Watchtower (scan → cold-blue stale table → email alert → "schema change detected"), Agents (2 clusters, hover/tap highlight, reminder pings, envelope → new field), Impact (dashboard powers on, bars grow), Builder (draggable skill sphere, packet orbits), Your Turn (envelope closes on the packet)
- [x] Packet travels the whole journey (`orbit` / `packetScale` per station)
- [x] Real screenshots → Websites panel textures when `media[].src` exists
- [x] `npm run shots` (scripts/shots.mjs) → `.shots/`, checked after every phase
- **Check:** scroll all 9 chapters on desktop + mobile; hover/tap the agent clusters; drag the skill sphere

## Phase 5: Interactions
- [x] Boot terminal overlay: fast typing + blinking caret, prompt with `help/about/projects/agents/contact/classic` + `sudo hire`, Esc/Enter/Start → dissolve + camera flight to The Spark; 1 s auto hand-off on repeat visits; skipped with reduced motion or a #deep-link
- [x] Custom cursor (dot + spring ring, "Open" on cards, "Drag" on the skill sphere), magnetic primary buttons
- [x] Cards → intercepted `/work/[slug]` overlay (`@modal` slot) with shared-layout morph; mobile full-screen sheet with swipe-down; focus trap, Esc, inert page, focus returns to the card; 3D paused while open
- [x] Metric count-ups (CountUp), line-by-line heading reveals (GSAP SplitText, masked) + fade-ups; all skipped with reduced motion
- [x] Screenshot folders + pre-filled paths + `public/images/projects/README.md`; missing files never requested (server-side existence check)
- [x] `npm run shots` also checks: boot appears, overlay opens and closes back to `/`, reduced-motion pass

## Phase 6: Polish
- [x] Lighting, fog, bloom (desktop only), motion tuning (done in Phases 3–4; final visual pass here)
- [x] 404: packet lost on an empty grid (pure HTML/CSS, static with reduced motion)
- [x] Reduced-motion & WebGL fallback, mobile tiers (high → low → min via PerformanceMonitor), touch interactions, device tilt (Android; iOS keeps auto-drift)
- [x] Favicon (`app/icon.svg`), Apple icon, Open Graph + Twitter image (static, local fonts)
- [x] Visual pass with `npm run shots` (+ Classic, case-study page, 404): Classic name overflow, count-up scope, case-header separator, 404 layout fixed
- [ ] Owner: fill the remaining placeholders before Phase 7 (list in the Phase 6 report)

## Mobile redesign + fonts (between Phase 6 and 7)
- [x] Fonts: Sora / Manrope / IBM Plex Mono; type scale re-tuned (hero = 3 lines at 360px); OG image uses the same fonts
- [x] Mobile "pinned stage": stage fixed top 55svh, sticky card bottom 45svh, scrubbed station animations, 2–3 beats per chapter, 50svh scrubbed flights
- [x] Websites swipe carousel (3D window comes forward), stacked agent cards, Impact metric beats with scrubbed count-up
- [x] Long content scrolls normally; the stage slides away and returns before the next flight
- [x] Reduced motion / no WebGL: no pinning or scrubbing, content stacked
- [x] `npm run shots`: 390×844 + 360×800, every chapter at scene start/mid/end, automatic overlap/overflow checks; desktop unchanged
- [ ] Owner: test on a real phone (see the report for steps)

## Mobile redesign v2: "flow" (DOM-anchored 3D, Oryzo-style)
- [x] Prototype at `/flow` (noindex, not linked): Spark → Websites → Pipeline. The main site is unchanged
- [x] Scroll sync after Lusion's WebGL-Scroll-Sync: absolute canvas (150lvh, 25% padding) re-positioned every frame; anchors measured in document px; 1 unit = 1 CSS px camera
- [x] Packet flies between anchors (route position from scroll, damped), lives inside each station; flights use a right-hand lane clear of the captions
- [x] Toys: Spark drag (spring), Websites swipe strip (scroll-snap), Pipeline "Refresh" burst
- [x] `npm run shots -- --flow`: anchors + mid-flight at 390×844 / 360×800 with drift, coverage, rest-point and covered-text checks (all pass)
- [ ] Owner: review on a real phone → then convert the remaining 6 chapters, replace the stage layout on mobile, decide on desktop

## Phase 7: SEO, audits, deploy
- [ ] Per-page metadata, OG images (site + per case study), sitemap, robots, JSON-LD Person
- [ ] Lighthouse desktop + mobile against the targets in PRD §2. Accessibility pass (axe, keyboard, NVDA, reduced motion)
- [ ] Grep for `[placeholder` / `[confirm` / `[FILL` before launch
- [ ] Unknown `/work/<slug>` returns HTTP 200 (streamed 404 UI + noindex, a PPR side effect). Return a real 404 (e.g. via `proxy`)
- [ ] GitHub → Vercel, set `NEXT_PUBLIC_SITE_URL`, domain

---

## Decision log
| Date | Decision | Why |
|---|---|---|
| 2026-11-23 | React 19.3.x, TS 6.0.x | R3F 9 peer `<19.4`. TS 7 needs an experimental Next flag |
| 2026-11-23 | Case studies via intercepted routes (`@modal/(.)work/[slug]`) | Shareable URL + in-place overlay. Journey stays mounted, so close returns to the same spot |
| 2026-11-23 | Reduced motion / no WebGL → Classic layout in place on `/` | No redirect, no extra load |
| 2026-11-23 | Boot screen not on the rail. Full on first visit, 1 s on repeat visits in a session | Owner's decision / default 13 |
| 2026-11-23 | Internal firm projects use flow diagrams, not screenshots | Internal tools can't be shown |
| 2026-11-23 | Native touch scroll on mobile (Lenis `syncTouch: false`) | Feels better on phones |
| 2026-11-23 | Project dates only for Elitenex (Jan 2026), Masstech (Apr 2026), OVI (Oct 2026). Role ranges kept | Owner restored these after first removing all dates |
| 2026-11-23 | OVI = HTML, custom CSS, JavaScript. Masstech = custom CSS, JavaScript, PHP form handling, SMTP email | Owner: use what the live source shows (no Bootstrap, scroll library or ExcelJS) |
| 2026-11-23 | **Solar Plasma** design system replaces the cyan system | Owner's step (a) review |
| 2026-11-23 | Job title at the firm = placeholder; no "AI/ML" | Owner hasn't confirmed the exact title |
| 2026-11-23 | Case studies: `notFound()` for unknown slugs | `dynamicParams` is unavailable with cacheComponents |
| 2026-11-23 | Offboarding Agent removed | Owner: not built by them |
| 2026-11-23 | Job title "Full-Stack Developer"; no solo/team wording on firm projects | Owner (NDA) |
| 2026-11-23 | Hold zones = sections; travel = transit gaps between sections (focus line at 50% of the viewport) | Panels scroll naturally, so long content works on mobile; no pinning needed |
| 2026-11-23 | Chapter rail only at xl+ (content gets `xl:pr-64`); bottom bar below xl | Rail labels need ~250px; below xl they would overlap panels |
| 2026-11-23 | Own anchor handler instead of Lenis `anchors` | Lenis doesn't preventDefault on hash links; one handler also manages focus |
| 2026-11-23 | three installed in Phase 2 | `path.ts` uses CatmullRomCurve3; only the `?debug` view loads it until Phase 3 |
| 2026-11-23 | Bloom/lighting polish in Phase 3, not Phase 6 | Owner: "premium from the start" |
| 2026-11-23 | 3D palette read from the CSS variables (`@theme static`) | One source of truth for HTML and WebGL colours |
| 2026-11-23 | Three curves (packet / camera / target) sampled at one t; framing via `camera.setViewOffset` | Object sits beside the HTML panel without changing where the camera looks |
| 2026-11-23 | Fog follows the camera (near = d+4, far = d+20); neighbouring stations hidden while parked | Keeps panels uncluttered; next station emerges from the fog during travel |
| 2026-11-23 | No drei `Trail` on the packet | Arriving from a station behind the camera, the trail swept past the lens as a giant streak |
| 2026-11-23 | `<body>` has no background (html paints it) | A body background would cover the fixed canvas at z-index −10 |
| 2026-11-23 | Mutable per-frame state lives in refs, uniforms via material refs | React Compiler lint (`react-hooks/immutability`) forbids mutating useMemo values |
| 2026-11-23 | Neighbouring stations drawn only when < 0.95 stations away | The station just passed sits behind the camera, where fog can't hide it |
| 2026-11-23 | Wide chapter heading panels `max-w-2xl`; rail gets a radial fade backdrop | Room for the 3D on wide chapters; rail labels stay readable over bright objects |
| 2026-11-23 | 3D labels are canvas-texture sprites; their words live in `content.ts` (`sceneLabels`, project titles) | No external font fetch (troika); copy rule |
| 2026-11-23 | `cn()` uses `extendTailwindMerge` with our @theme tokens | Plain twMerge dropped `text-gold` next to `text-metric` (treated as two colours) |
| 2026-11-23 | File links (e.g. `/resume.pdf`) are plain `<a>` | next/link prefetched the missing PDF as a route (404) |
| 2026-11-23 | Known console warning: `THREE.Clock` deprecated | Comes from R3F 9.8 internals with three 0.187; harmless, goes away when R3F updates |
| 2026-11-23 | Screenshot existence resolved on the server (`lib/media.ts`), `.png/.webp/.jpg` accepted | Owner drops files in without code changes; missing files never requested (no 404s) |
| 2026-11-23 | NDA projects: optional `hero.png` cover, nothing shown while missing | Internal tools; the flow diagram stays the main visual |
| 2026-11-23 | Overlay morph: panel shares `layoutId` with the card, content fades in after the morph | Avoids stretched text mid-animation |
| 2026-11-23 | Overlays/boot lock the page with `inert` + Lenis stop + `overflow: hidden`; inner scrollers use `data-lenis-prevent` | Stopped Lenis blocks wheel events except inside `data-lenis-prevent` |
| 2026-11-23 | Card links use `scroll={false}` | Next would otherwise scroll the page when the intercepted route mounts |
| 2026-11-23 | Effects never return expression results (`useEffect(() => { … })`) | Newer Chrome returns a Promise from `scrollIntoView`; React crashed on the "cleanup" |
| 2026-11-23 | Third 3D tier `min` (dpr 1, 300 particles, no large glow sprites); phones on `low` cap dpr at 1.25 | Fill rate (pixel density + additive overdraw) is the bottleneck on mid-range Android |
| 2026-11-23 | Device-tilt parallax only where no permission prompt is needed (Android) | An iOS permission prompt would interrupt the journey |
| 2026-11-23 | 404 is HTML/CSS, not WebGL | Instant, works without WebGL, nothing to load on an error page |
| 2026-11-23 | OG/Apple icon colours in `lib/brand.ts` (mirrors tokens); fonts from `@fontsource` .woff read at module load | Satori can't read CSS vars or woff2; module-level reads keep the images static |
| 2026-11-23 | Count-up only for before → after metrics | "24-hour rule" is a rule, not a result |
| 2026-11-23 | Case-study routes (page + intercepted overlay) read `params` only inside `<Suspense>`; slug content is a `"use cache"` component; case-study links use `prefetch` | Fixes Next 16 "instant-shell-url-data": the App Shell stays URL-independent (instant navigation) and per-link prefetch loads the cached overlay before the click, so the morph starts immediately. Both routes still prerender every slug |
| 2026-11-23 | Fonts: Sora (600/700) + Manrope + IBM Plex Mono kept | Owner's request; Plex's technical feel pairs with geometric Sora. Sora has no 800 → `font-bold` |
| 2026-11-23 | Mobile = "pinned stage" (`stage:` variant: < 1024px or touch, motion on, WebGL) | Scroll drives the 3D story on phones instead of a background animation |
| 2026-11-23 | One DOM for desktop + stage layouts (`chapter-frame` utility, `data-scene`/`data-scene-card`) | No duplicated content; desktop markup renders identically |
| 2026-11-23 | Stage above content (opaque, z-20) instead of content above stage | Cards scrolling out of their pinned spot slide under the stage: text can never overlap the 3D |
| 2026-11-23 | svh units for stage/card; engine reads the stage's and card's pixel sizes from the DOM | Stable triggers when the mobile URL bar shows/hides |
| 2026-11-23 | Stage slides away (transform) during long content; 3D pauses when fully hidden | Full screen for long lists without resizing the canvas |
| 2026-11-23 | Duplicate card copies (desktop grid hidden on phones) only claim the shared `layoutId` in their own mode | Two mounted layoutIds would morph the overlay out of the hidden card |
| 2026-11-23 | `allowedDevOrigins: ["192.168.101.47"]` | Next 16 dev blocks dev assets for non-localhost origins; needed for phone testing |
| 2026-11-23 | Mobile v2 prototyped on a separate `/flow` route | Review on a phone without breaking the working mobile journey |
| 2026-11-23 | Flow canvas: `position: absolute` in an `overflow: clip` wrapper, 150lvh tall, translateY(scrollY − top − pad) per frame | Lusion's technique: page and canvas scroll together natively (no drift); padding hides edges on fast flicks; lvh avoids resizes when the URL bar moves |
| 2026-11-23 | Packet route keyed to slot centres; size changes early in a flight; right-hand flight lane | Packet never covers captions (verified by the shot checks) |
| 2026-11-23 | `PacketBody` shared by desktop `Packet` and `FlowPacket`; Lenis CSS moved into globals.css | One packet look; no unused CSS chunk preloaded on other routes |
| 2026-11-23 | puppeteer-core 24 → 25.18.1 (dev only) | `npm audit`: 9 high advisories, all via puppeteer-core's transitive deps (proxy-agent/basic-ftp, extract-zip, chromium-bidi/zod); none in the production tree. v25.18 is outside the affected range → 0 vulnerabilities |
| 2026-11-23 | Classic View blocks live in `src/components/classic/` | Keeps `sections/` strictly one-per-chapter |
| 2026-11-23 | Kept the create-next-app 16.4 defaults: `cacheComponents`, `partialPrefetching`, `@tailwindcss/turbopack` | Current recommended setup; all pages are static content anyway |
| 2026-11-23 | GitHub/LinkedIn icons are inline SVGs (lucide's earlier ISC outlines) | lucide-react 1.x removed brand icons; Simple Icons no longer has LinkedIn |
| 2026-11-23 | React pinned with `~19.3.1` in package.json | Stops `npm update` from pulling 19.4, which R3F 9 doesn't support |

## Backlog
Light theme · .glb station models · per-project OG images with screenshots · blog
