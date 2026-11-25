# PRD: "Follow the Data", the portfolio of Yogesh Gangarde

| | |
|---|---|
| Owner | Yogesh Gangarde |
| Status | Phase 1 in progress |
| Last updated | 2026-11-23 |
| Related | `UIUX.md` · `TODO.md` · `CLAUDE.md` · all copy in `src/data/content.ts` |

## 1. Summary
An award-level, cinematic 3D portfolio that is also fast, professional and fully mobile-friendly. Visitors follow one glowing data packet along a continuous camera path through 9 stations. Each station tells part of the work: websites → a product → a data platform → a monitoring agent → AI agents → impact → skills → contact. Every project is a full case study. A plain **Classic View** gives recruiters the facts in 10 seconds.

## 2. Goals and success metrics
| Goal | Target |
|---|---|
| Premium first impression | Cinematic, smooth, never template-like. 60 fps on a mid-range laptop, smooth on a mid-range Android phone |
| Facts fast | `/classic` shows role, focus, headline results and contact above the fold |
| Substance | 8 full case studies with specific, factual details |
| Lighthouse | Performance 85+ desktop / 70+ mobile · Accessibility 95+ · SEO 95+ |
| Shareable | Each case study has its own URL (`/work/[slug]`), metadata and OG image |

## 3. Audience
Recruiters and hiring managers (fast facts, often on a phone), engineers (depth, code quality, performance), and freelance clients (websites, automation).

## 4. Content rules
- Use only facts the owner has given. Mark gaps as `[placeholder: …]` and items to check as `[confirm: …]`.
- Employer = "a large real estate firm". No internal DB, schema or table names.
- Dates only where given: Elitenex Jan 2026, Masstech Apr 2026, OVI Oct 2026 (projects only). Experience has no dates or timeline. No education section. No résumé on the site.
- Job title at the firm is a placeholder until confirmed (don't use "AI/ML").
- Visual system: **Solar Plasma** (see `UIUX.md`).
- Masstech's company stats are never presented as the owner's achievements.
- LocalPilot is presented honestly: **Built** vs **In progress**.
- Times in IST.

## 5. Projects (8 case studies)
| Slug | Title | Group / chapter | Badge |
|---|---|---|---|
| `ovi-iot-solutions` | OVI IoT Solutions | Websites · Ch 2 | Freelance · Live |
| `masstech-business-solutions` | Masstech Business Solutions | Websites · Ch 2 | Freelance · Live |
| `elitenex` | Elitenex | Websites · Ch 2 | Portfolio project (link: "Coming soon") |
| `localpilot` | LocalPilot | Product · Ch 3 | In development (context: Portfolio project) |
| `snowflake-data-platform` | Snowflake Data Platform | Data · Ch 4 | In production |
| `staleness-agent` | Staleness Agent | Data · Ch 5 | In production |
| `qagent` | QAgent | Agents · Ch 6 | In production |
| `compliance-agent` | Compliance Agent | Agents · Ch 6 | In production |

Case study structure: Overview · The problem · What I built · Key features · How it works (flow) · My role · Tech stack · Results / impact · Status · Links · Screenshots (internal firm projects use a **flow diagram** instead of screenshots).

## 6. Chapters
| # | Name | 3D station | HTML content |
|---|---|---|---|
| 0 | Boot | Terminal loader (overlay, **not on the rail**) | Boot lines, Start / Skip to Classic, commands `help about projects agents contact classic`, `sudo hire` |
| 1 | The Spark | Lone packet reacting to the cursor | Name, headline, intro, scroll hint |
| 2 | Where Data Is Born | Arc of browser panels with screenshot textures | OVI, Masstech, Elitenex cards |
| 3 | The Cockpit | Control panel, screens light up | LocalPilot |
| 4 | The Pipeline & Warehouse | Tubes → crystalline cube, tables refresh | Snowflake data platform |
| 5 | The Watchtower | Scanner ring, amber stale table, envelope, diagnostic label | Staleness Agent |
| 6 | The Agents | Node network, 2 agent clusters, report check + reply | QAgent, Compliance |
| 7 | The Impact | Dashboard screen | Before → after metrics |
| 8 | The Builder | Draggable skill-label cluster | Skills + experience (no dates) |
| 9 | Your Turn | Packet flies into an inbox | Email, GitHub, LinkedIn |

## 7. Functional requirements
- **Device routing:** "/" serves the desktop journey or, for phones and tablets, the mobile Data Core (internal route `/m`, same URL; see `src/proxy.ts`).
- **Journey (`/`)**: tall scroll page, one HTML section per chapter. Fixed canvas behind it. Hold zones keep the camera still while a panel is readable. Progress rail (desktop, chapters 1–9, click to jump). Bottom bar on mobile (current chapter + menu).
- **Case study**: clicking a card opens `/work/[slug]` as an intercepted-route overlay with a shared-layout expand (full-screen sheet on mobile). The journey stays mounted underneath, so closing it (button or Esc) returns to the same spot. A direct visit renders the standalone page. Sticky mini table of contents on desktop.
- **Classic View (`/classic`)**: fast, beautifully typeset single page with the same content and no WebGL. Header toggle "Classic view" / "Immersive view". With reduced motion or no WebGL, `/` renders the Classic layout in place, with a note.
- **Boot**: full on the first visit. On later visits in the same session, a 1-second skippable version.
- **Impact metrics**: count up when they enter view. Only the provided facts.
- **404**: the data packet "lost" on an empty grid.
- **Delights**: custom cursor (fine pointers only), magnetic buttons, link underline animation, line-by-line text reveal, card hover tilt.

## 8. Non-functional requirements
- Meaningful HTML first. The 3D bundle loads after first paint.
- Desktop dpr [1,2], mobile dpr ≤ 1.5. Instancing, disposal, pause when hidden or covered, automatic lower tier on low FPS.
- Mobile-first panels, tested at 360 / 390 / 768 / 1024+ in portrait and landscape. 16px minimum body text, 44px touch targets. Tap replaces hover. Gentle auto-motion (device tilt only on Android or opt-in).
- Lenis keeps native touch scrolling on touch devices.
- SEO: per-page metadata, OG image, sitemap, robots, JSON-LD `Person`. `SITE_URL` lives in one constant (`src/lib/site.ts`, env `NEXT_PUBLIC_SITE_URL`).
- Accessibility: WCAG 2.2 AA, keyboard, reduced motion, all content in HTML.
- No tracking, no paid assets.

## 9. Tech
Next.js 16 · React 19.3 · TypeScript 6 · Tailwind 4 · three / R3F 9 / drei 10 / postprocessing (bloom) · gsap + ScrollTrigger · lenis · motion · zustand · lucide-react · Vercel. Versions are in `CLAUDE.md`.

## 10. Open items (owner to fill)
- GitHub URL, LinkedIn URL, production domain.
- LocalPilot: is approval-before-publishing built or in progress?
- Snowflake platform: the "before" problem.
- Firm projects are under NDA: keep details to what the owner has provided. Never mention solo/team.

## 11. Risks
| Risk | Mitigation |
|---|---|
| A cinematic 3D page hurts mobile performance | Tiers, auto-fallback, HTML first, Classic layout fallback |
| Scroll/camera desync | Single progress source (Lenis → ScrollTrigger → store), read in `useFrame` |
| The intercepted-route modal and shared layout clash | Card stays mounted; `layoutId` shared between card and modal; standalone page has no dependency on the modal |
| Placeholders ship | Pre-deploy grep for `[placeholder` / `[confirm` / `[FILL` |
