# CLAUDE.md

Portfolio of **Yogesh Gangarde**, a full-stack developer who builds web apps, data pipelines and AI agents.
Concept: **"Follow the Data"**. One fixed 3D canvas, a camera path through 9 stations, and HTML chapter panels over it.
Also `/classic` (no WebGL) and `/work/[slug]` (case studies).

**Read before working:** `PRD.md` (scope, content rules) · `UIUX.md` (design system, motion, chapters) · `TODO.md` (current phase).
`AGENTS.md` is managed by `next dev`. Leave it alone. It points to the bundled docs in `node_modules/next/dist/docs/`; check them before using any Next API. This Next version has `cacheComponents` and `partialPrefetching` on, and Tailwind runs through `@tailwindcss/turbopack` (no PostCSS config). Avoid `new Date()` / request APIs in server components unless they're wrapped as the docs describe.

## Workflow rules
- Work **one phase at a time** (`TODO.md`). At the end of a phase (or sub-step), tick the boxes, list the files created or changed, the commands to run, and what to check on **desktop and mobile**. Then **stop and wait for the user's OK**.
- Ask when something is unclear or marked `[placeholder]` / `[confirm]`. Explain important decisions in 1–2 lines and skip React/Node basics.
- **Comment the scroll and camera logic clearly.** The user wants to learn from it.
- Record decisions in the `TODO.md` decision log. Keep `PRD.md` / `UIUX.md` in sync when something changes.

## Content rules (strict)
- **Never invent** facts, numbers, clients, technologies or results. If something is missing, write `[placeholder: …]`; if it needs checking, write `[confirm: …]`. Both render in mono with a dashed underline via `<Txt>`.
- Don't use "AI/ML" in the job title unless the owner confirms it. The title is a placeholder for now.
- All copy lives in `src/data/content.ts`. Components never hard-code copy.
- The employer is always **"a large real estate firm"**. Never show its name, or any internal database, schema or table names.
- **Dates only where the owner gave them:** Elitenex Jan 2026, Masstech Apr 2026, OVI Oct 2026, plus the two role ranges. No other project dates.
- Don't present Masstech's company stats (years, projects, clients) as Yogesh's achievements.
- LocalPilot: always separate **Built** from **In progress**.
- Times are shown in **IST**. No education section.

## Commands
```bash
npm run dev     # http://localhost:3000
npm run build   # production build + type check: must pass before a phase is done
npm run lint
npm run start   # serve the production build (use it for Lighthouse)
npm run shots   # after `npm run build`: headless Chrome screenshots of every chapter (desktop + mobile) → .shots/
                # `-- --only=agents,builder` for a subset, `-- --phones=only` to skip desktop. Phones (390×844, 360×800)
                # capture every chapter at scene start/mid/end with an automatic stage/card overlap check.
                # Look at the images before reporting a phase as done.
```

## Stack (verified on npm, 2026-11-23)
| Package | Version | Note |
|---|---|---|
| next | 16.4.x | App Router, Turbopack, Node >= 20.9 |
| react / react-dom | 19.3.x | **Stay below 19.4** (`@react-three/fiber@9` peer is `>=19 <19.4`) |
| typescript | 6.0.x | TS 7 has no JS compiler API; Next needs an experimental flag for it |
| tailwindcss | 4.3.x | CSS-first tokens in `globals.css` `@theme`, no config file |
| three, @react-three/fiber, @react-three/drei | 0.187 / 9.8 / 10.7 | Phase 3+ |
| @react-three/postprocessing + postprocessing | 3.2 / 6.39 | Bloom only, desktop tier |
| gsap + @gsap/react, lenis | 3.15 / 2.1, 1.3 | Phase 2. Package is `lenis`, not `@studio-freight/lenis` |
| motion | 14.x | Import from `motion/react` |
| zustand | 5.x | Scroll/progress store |
| lucide-react | 1.x | The only UI icon set. No emoji |

Before upgrading a major version, check `npm view <pkg> peerDependencies`.

## Structure
```
src/app/                    page.tsx (journey), classic/, work/[slug]/, @modal (intercepted case study), layout, not-found
src/components/sections/    one component per chapter (BootSection … ContactSection)
src/components/classic/     Classic View blocks
src/components/ui/          Header, ChapterNav, Cursor, ProjectCard, StatusBadge, CaseStudy, MetricCounter, Timeline, Terminal, Txt…
src/components/three/       Experience.tsx (Canvas), CameraRig.tsx, path.ts, stations/*
src/data/content.ts         ALL copy: profile, chapters, projects + case studies, metrics, skills, experience
src/store/                  zustand stores (progress, active chapter, UI)
src/hooks/  src/lib/        hooks; utils (cn), site.ts (SITE_URL — the single place to change the domain)
public/images/projects/[slug]/   screenshots (added by the user later)
```

## Code conventions
- TypeScript strict, **no `any`**. Typed props. Small components (aim for under ~150 lines).
- Server components by default. Add `"use client"` as low in the tree as possible.
- Fonts: Sora (headings, 600/700), Manrope (body), IBM Plex Mono (labels/numbers). No 800 weight.
- Mobile "pinned stage": the `stage:` Tailwind variant (globals.css) and `STAGE_QUERY`/`isStageMode()` (lib/stageMode.ts) must stay identical. Chapter structure: `[data-scene]` + sticky `[data-scene-card]` (measured by hooks/useJourneyScroll.ts). Stations read scrub progress via `scrubbed()` (rig.ts); desktop keeps their timers.
- Tailwind with `@theme` tokens only ("Solar Plasma", see `UIUX.md`). No raw hex in components. Use `cn()` for conditional classes. Custom utilities: `card`, `panel`, `bg-signature`, `text-signature`, `bg-plasma`, `ambient-glow`, `label-mono`, `link-underline`.
- Imports use `@/`. Files are `PascalCase.tsx` (components) and `camelCase.ts` (hooks, libs).

## Scroll / 3D rules
- ONE fixed `<Canvas>` (client-only, `next/dynamic` with `ssr: false`), loaded after first paint.
- Scroll progress (0→1) goes into a zustand store. `useFrame` reads it via `store.getState()` or refs. **Never re-render React per scroll frame.**
- Camera follows a `CatmullRomCurve3`. Hold zones are flat segments in the scroll→path mapping.
- Stations animate only when the camera is near them. Use instancing for repeated meshes, never allocate inside `useFrame`, dispose manual resources, pause when the tab is hidden, an overlay covers the canvas, or on `/classic`.
- Tiers: desktop (dpr [1,2] + bloom) · mobile (dpr ≤ 1.5, fewer nodes, no postprocessing) · auto-fallback tier on low FPS · reduced motion / no WebGL → Classic layout.
- All readable content is HTML. The 3D is `aria-hidden`.

## Accessibility
Skip link, landmarks, one `h1` per page, visible `:focus-visible`, keyboard for everything (Enter opens a case study, Esc closes it), no hover-only info, 44px touch targets, 16px minimum body text, contrast ≥ 4.5:1.

## Don'ts
No tracking scripts, no paid assets, no copied portfolio designs, no emoji, no secrets in the repo.
