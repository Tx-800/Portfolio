# UI/UX Spec: "Follow the Data" · Solar Plasma

These tokens become `@theme` variables in `src/app/globals.css`, the single source of truth. Never hard-code values in components.

## 1. Principles
1. **One hero object per chapter**, well lit, with depth (fog, soft rim light, bloom only on accent elements). No clutter.
2. **Typography leads.** Large, tight Sora headings, short scannable paragraphs, bullets and metric callouts.
3. **Each chapter is a staged beat:** entrance → hold (readable) → exit.
4. **Warm energy, used with intent.** The signature gradient marks what's alive (packet, accent words, primary buttons, hero glows). It's never a flat page background. Cold blue is used *only* for stale data.
5. **Content is always readable**: frosted dark panels over the 3D, and a Classic View for everything.

## 2. Colour tokens
| Token | Value | Use | Contrast (bg / surface / raised) |
|---|---|---|---|
| `bg` | `#0B0612` | Page (dark plum); also dark text on gradient buttons | n/a |
| `surface` | `#140A1C` | Cards | n/a |
| `surface-2` | `#1A0F24` | Raised, chips | n/a |
| `border` | `#2A1C33` | Hairlines, card borders | decorative |
| `border-strong` | `#3A2840` | Secondary buttons, timeline, dashed placeholders | decorative |
| `heading` | `#FFF4EC` | Headings, nav CTA fill | 18.5 / 17.8 / 17.1 |
| `body` | `#C9B8C4` | Body text | 10.6 / 10.2 / 9.8 |
| `muted` | `#A3929E` | Meta, labels | 6.8 / 6.6 / 6.3 |
| `accent` | `#FF6B2C` | Solar orange: primary accent, fresh tables | 7.1 / 6.8 / 6.5 |
| `accent-2` | `#FF2E88` | Plasma pink: secondary accent | 5.7 / 5.5 / 5.3 |
| `gold` | `#FFC44D` | Chapter labels, key metrics, badges, **focus ring** | 12.6 / 12.2 / 11.7 |
| `stale` | `#7B8CFF` | Cold blue: stale data only | 6.7 / 6.5 / 6.2 |

- **Signature gradient** (`bg-signature` / `text-signature`): gold → orange → pink at 100°. Used for headline accent words, the data packet, hero glows and timeline dots.
- **Button gradient** (`bg-plasma`): orange → pink. Dark text `#0B0612` on it is ≥ 5.7:1.
- **Ambient glow** (`ambient-glow`): two large soft radials (orange 22%, pink 18%) behind hero areas.
- **Focus ring:** `2px solid gold`, 3px offset.
- **Content placeholders** (`[placeholder…]`, `[confirm…]`) render in **mono with a dashed underline**, with no colour of their own (gold is a theme colour now).

## 3. Typography
- **Sora** 600/700 for display and headings (tight) · **Manrope** 400/500/600 for body · **IBM Plex Mono** 400/500 for labels, chapter numbers, metrics, terminal and badges (kept: its slightly technical character suits the "data" theme next to the geometric Sora).
- Sora has no 800 weight: headings use 700 (`font-bold`).

| Role | Size | LH | Tracking |
|---|---|---|---|
| Display (hero headline) | `clamp(2.25rem, 1.2rem + 4.6vw, 6rem)` (36px at 360 wide → 96px) | 1.02 | -0.035em |
| h2 / chapter title | `clamp(1.875rem, 1rem + 3.6vw, 3.75rem)` (1.625rem inside the mobile stage card) | 1.04 | -0.03em |
| h3 | `clamp(1.25rem, 2.2vw, 1.625rem)` | 1.15 | -0.015em |
| Body | `1.0625rem` (≥ 16px everywhere) | 1.65 | 0 |
| Label (mono, uppercase) | `0.75rem` | 1.4 | 0.16em |
| Metric (mono) | `clamp(2.25rem, 5vw, 3.5rem)` | 1 | -0.02em |

Chapter label format: `01 — THE SPARK` (gold). Reading width max `62ch`.
Hero headline: `text-wrap: balance`, "AI agents." never splits → 3 lines at 360px ("I connect / apps, data / and AI agents."); 3 lines on desktop (`lg:max-w-[10ch]`).

## 4. Layout
- 12-column grid, container `max-w-[1240px]`, gutters 16 / 24 / 40px.
- Radius: cards **28px**, buttons and badges **pill**.
- Card shadow: `0 30px 80px -30px` pink at 45% (`shadow-card`).
- **Journey chapters:** each at least one screen tall (hold zones are added in Phase 2). Panels alternate left and right on desktop (`lg:w-[min(600px,50%)]`). Card-grid chapters ("wide") put a heading panel above the full-width grid. On mobile, panels stack (Phase 2/3 moves them into the lower part of the screen over the 3D).

## 5. Components
- **Logo / wordmark:** "yogesh" in Sora 700 with an orange asterisk.
- **Header:** wordmark, Classic/Immersive toggle (secondary pill), **"Let's talk"** CTA as a solid `heading`-coloured pill with dark text.
- **Primary button:** `bg-plasma` pill, dark text, orange glow (`shadow-glow`). Hover brightens the glow.
- **Secondary button:** pill, 1px `border-strong`, light text.
- **StatusBadge:** small mono pill, gold text on gold/10. The dot pulses for "In development" and is a ring for "Practice project".
- **ProjectCard:** `card` (surface, border, pink shadow), badge + date, title, context, tagline, ≤ 4 tech chips + "+N", a visible "Read case study" affordance. Hover lifts 4px.
- **MetricCounter:** translucent `panel`, label, struck-through *before* → big **gold** mono *after*.
- **Timeline:** `border-strong` line, gradient dots, gold mono dates.
- **CaseStudy:** header with ambient glow, sticky TOC (≥ 1024px), numbered sections, flow steps, result tiles, screenshot placeholders or a flow diagram, "Next case study".
- **Icons:** lucide-react, 18–20px. GitHub/LinkedIn are inline outlines in the same style. No emoji.

## 6. Motion
| Token | Value |
|---|---|
| UI durations | 200 / 300 / 400 ms |
| Scene transitions | 0.8–1.5 s |
| `ease-out` | `cubic-bezier(0.22, 1, 0.36, 1)` (entrances) |
| `ease-in-out` | `cubic-bezier(0.65, 0, 0.35, 1)` (camera, layout) |
| Spring | stiffness 260, damping 30 (tilt, cursor, magnetic) |

- Camera eases along the path with slight inertia and gentle pointer parallax (±2°). On mobile, slow automatic drift.
- Panels: fade + 24px rise when the camera reaches the hold zone, lines revealed one by one (60 ms stagger).
- **Reduced motion:** Classic layout, no smooth scroll, no reveals, no cursor effects.

## 7. Chapter staging (3D notes)
| # | Hero object | Beat |
|---|---|---|
| 1 | Packet (signature-gradient emissive core + halo) | Follows the cursor softly |
| 2 | 3 browser panels on an arc | Packet emerges from one; panels tilt to the cursor |
| 3 | Cockpit with small screens | Screens light up orange one by one |
| 4 | Glowing tubes → faceted glass cube | Inner table slabs refresh with a warm light sweep |
| 5 | Scanner ring over tables | Fresh slabs glow **orange**; one turns **cold blue** (stale) → envelope → "schema change detected" |
| 6 | Node network, 2 clusters (Onboarding, Compliance) | Orange/pink pulses; hover/tap a cluster; an HR email arrives and pings fly to "people" nodes for Onboarding; an envelope arrives and a field slots in for Compliance |
| 7 | Floating dashboard | Lights up; HTML metrics count up in gold |
| 8 | Skill-label cluster | Drag to rotate; the packet orbits it |
| 9 | Inbox / envelope | Packet flies in; the envelope glows |

Lighting (implemented in Phase 3):
- Low warm ambient + gold hemisphere + one key light. A pink rim light behind the current station and a gold fill near the camera both move with the camera. The packet carries its own orange light.
- Desktop: lightformer environment (no HDR download) for warm reflections on metal and glass; Bloom (threshold 0.9, so only emissive accents boosted above 1.0 glow) → ACES tone mapping → soft vignette.
- Every accent also has an additive halo sprite, so phones (no bloom) still glow.
- Linear fog in `bg` colour that follows the camera: the current station is crisp, the next one emerges from the fog during travel.
- Framing: `camera.setViewOffset` shifts each station beside its panel (desktop) or above it (mobile); values in `components/three/path.ts`.

## 8. Mobile: "pinned stage" scrollytelling
Applies below 1024px **or** on touch devices, with motion allowed and WebGL available (Tailwind `stage:` variant = `STAGE_QUERY` in `lib/stageMode.ts`). Desktop is unchanged; reduced motion / no WebGL get the stacked, unpinned layout.

- **Split screen:** the 3D stage is fixed in the top **55svh** (opaque, above the content: text never sits over the 3D); each chapter's card pins in the bottom **45svh** (sticky at `top: 55svh`). svh units keep the triggers stable when the mobile URL bar shows/hides.
- **Pinned scene per chapter:** `[data-scene]` is 175svh tall → the card stays pinned for ~1.3 screens of scroll while the scroll **scrubs** the station (forwards and backwards):
  Spark: packet scales in, orbit rings draw · Websites: windows fan out; swipe carousel (scroll-snap) brings the active window forward · Cockpit: screens light one by one · Pipeline: pulses flow, cube layers fill bottom → top · Watchtower: scan → stale (cold blue) → email → diagnosis at set points · Agents: clusters light in turn, tap to pin one · Impact: bars grow and numbers count with the scroll · Builder: sphere turns with the scroll, still swipeable · Your Turn: the packet seals the envelope at the end.
- **Beats:** 2–3 short lines per chapter (`chapters[].beats` in content.ts) swap in the card with the scrub (slide/fade + progress dashes). Impact uses the three metrics as its beats; Websites uses the carousel.
- **Between chapters:** a 50svh transit = a short scrubbed camera flight.
- **Long content** (spotlight details, stacked cards, skills, timeline) scrolls normally after the scene; the stage slides up out of the way and returns before the next flight. Project cards on mobile **stack** (sticky deck); tap opens the case-study sheet.
- Native touch scrolling (no smooth-scroll hijack), taps instead of hover, device tilt on Android, performance tiers unchanged (no bloom on phones; `min` tier on weak devices). All scrubbing runs from the progress store; no React re-render per frame.
- Chapter jumps (rail, bar, boot hand-off) land at the start of a chapter's scene. The chapter bar stays at the bottom; cards leave room for it.

## 9. Accessibility
Skip link · landmarks · one h1 per page · gold focus ring · dialog focus trap, Esc closes, focus restored · canvas `aria-hidden` · nothing hover-only · reduced motion honoured · every text/surface pair ≥ 4.5:1 (table §2).

## 10. Originality guardrails
No desk/room scenes, no astronauts, no generic particle galaxies. The visual language is the **data packet + pipeline** motif in warm solar/plasma energy, reused for the favicon, OG image and 404 ("packet lost on an empty grid").
