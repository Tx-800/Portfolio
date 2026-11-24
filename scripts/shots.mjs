/**
 * Visual check with the locally installed Chrome (headless, SwiftShader WebGL). Run after every
 * phase and look at the images before reporting.
 *
 *   npm run build && npm run shots
 *   npm run shots -- --only=watchtower,agents      only some chapters (plus "overlay", "pages")
 *   npm run shots -- --url=http://localhost:3000  use an already running server
 *   npm run shots -- --flow                       only the mobile Data Core prototype (/flow)
 *
 * Captures:
 *   desktop-<chapter>.png              1440×900, each chapter + two travel moments
 *   m390-<chapter>-{start,mid,end}.png  mobile "pinned stage" at 390×844 and 360×800 (m360-…):
 *                                      each chapter at the start, middle and end of its pinned
 *                                      scene, with an automatic overlap check (stage vs. card)
 *   core-m390-<nn-moment>.png          /flow prototype: every hold, gate approach/pass, a site switch (--flow)
 *   *-boot / *-overlay / *-page-* / reduced-*   boot terminal, case-study overlay, other pages,
 *                                      reduced motion
 *
 * Output: .shots/ (git-ignored). Console errors, failed requests and layout problems are
 * printed at the end. Chrome path: auto-detected, or set CHROME_PATH.
 */
import { spawn } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import puppeteer from "puppeteer-core";

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v = "true"] = a.replace(/^--/, "").split("=");
    return [k, v];
  }),
);

const PORT = 3123;
const OUT = ".shots";
const CHAPTERS = ["spark", "websites", "cockpit", "pipeline", "watchtower", "agents", "impact", "builder", "contact"];
const only = args.only ? args.only.split(",") : null;
const chapters = only ? CHAPTERS.filter((c) => only.includes(c)) : CHAPTERS;
const DESKTOP_TARGETS = only ? chapters : [...CHAPTERS, "transit:pipeline", "transit:agents"];
const DESKTOP = { name: "desktop", width: 1440, height: 900, mobile: false };
const PHONES = [
  { name: "m390", width: 390, height: 844, mobile: true },
  { name: "m360", width: 360, height: 800, mobile: true },
];
/** Time for the camera to settle (damping) and station animations to play, per shot. */
const SETTLE_MS = 3500;
/**
 * Software WebGL renders only a few fps and frame deltas are clamped, so the first jump from
 * the top of the page needs much longer to settle than chapter-to-chapter moves.
 */
const FIRST_SETTLE_MS = 10000;
/** Scene positions captured on phones (scrub progress). */
const SCENE_POINTS = [
  ["start", 0.04],
  ["mid", 0.5],
  ["end", 0.96],
];

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

function findChrome() {
  const candidates = [
    process.env.CHROME_PATH,
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
  ];
  const found = candidates.find((p) => p && existsSync(p));
  if (!found) throw new Error("Chrome not found. Set CHROME_PATH.");
  return found;
}

async function waitFor(url, ms = 30000) {
  const start = Date.now();
  while (Date.now() - start < ms) {
    try {
      if ((await fetch(url)).ok) return;
    } catch {
      /* not up yet */
    }
    await wait(500);
  }
  throw new Error(`Server did not start at ${url}`);
}

async function openJourney(browser, base, vp, problems) {
  const page = await browser.newPage();
  await page.setViewport({ width: vp.width, height: vp.height, deviceScaleFactor: 1, isMobile: vp.mobile, hasTouch: vp.mobile });
  page.on("console", (m) => ["error", "warn"].includes(m.type()) && problems.push(`[${vp.name}] ${m.type()}: ${m.text()}`));
  page.on("pageerror", (e) => problems.push(`[${vp.name}] pageerror: ${e.message}`));
  page.on("response", (r) => r.status() >= 400 && problems.push(`[${vp.name}] HTTP ${r.status()}: ${r.url()}`));
  await page.goto(base, { waitUntil: "load" });
  await wait(4000);
  if (!(await page.evaluate(() => Boolean(document.querySelector("canvas"))))) problems.push(`[${vp.name}] no <canvas> mounted`);
  return page;
}

async function save(page, name) {
  const file = `${OUT}/${name}.png`;
  await page.screenshot({ path: file });
  console.log("saved", file);
}

/** Boot terminal (fresh browser = first visit): capture it, then Esc = "Start the journey". */
async function passBoot(page, vp, problems) {
  const hasBoot = await page.evaluate(() => Boolean(document.querySelector('[aria-labelledby="boot-title"]')));
  if (hasBoot) {
    if (!only) await save(page, `${vp.name}-boot`);
    await page.keyboard.press("Escape");
    await wait(3000);
  } else if (!only) {
    problems.push(`[${vp.name}] boot terminal did not appear`);
  }
}

async function desktopPass(browser, base, problems) {
  const vp = DESKTOP;
  const page = await openJourney(browser, base, vp, problems);
  await passBoot(page, vp, problems);
  for (const [i, target] of DESKTOP_TARGETS.entries()) {
    await page.evaluate((target) => {
      if (target.startsWith("transit:")) {
        const gap = document.getElementById(target.slice(8))?.nextElementSibling;
        if (!gap) return;
        const r = gap.getBoundingClientRect();
        window.scrollTo(0, r.top + window.scrollY + r.height / 2 - window.innerHeight / 2);
        return;
      }
      const el = document.getElementById(target);
      if (el) window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - 64);
    }, target);
    await wait(i === 0 ? FIRST_SETTLE_MS : SETTLE_MS);
    await save(page, `${vp.name}-${target.replace(":", "-")}`);
  }
  if (!only || only.includes("overlay")) await overlayCheck(page, vp, problems);
  await page.close();
}

/**
 * Phones: the pinned-stage journey. For each chapter, scroll to the start / middle / end of its
 * pinned scene (measured exactly like the scroll engine does) and check the layout: the card
 * must sit entirely below the stage and inside the viewport.
 */
async function phonePass(browser, base, vp, problems) {
  const page = await openJourney(browser, base, vp, problems);
  await passBoot(page, vp, problems);
  const stageOn = await page.evaluate(() => {
    const stage = document.getElementById("stage");
    return Boolean(stage && getComputedStyle(stage).zIndex === "20");
  });
  if (!stageOn) problems.push(`[${vp.name}] stage mode is not active`);

  let first = true;
  for (const chapter of chapters) {
    for (const [label, p] of SCENE_POINTS) {
      const target = await page.evaluate(
        (id, p) => {
          const scene = document.querySelector(`#${id} [data-scene]`);
          const card = scene?.querySelector("[data-scene-card]");
          if (!scene || !card) return null;
          const top = scene.getBoundingClientRect().top + window.scrollY;
          const cardTop = parseFloat(getComputedStyle(card).top) || 0;
          const distance = scene.offsetHeight - card.offsetHeight;
          return top - cardTop + distance * p;
        },
        chapter,
        p,
      );
      if (target === null) {
        problems.push(`[${vp.name}] ${chapter}: no pinned scene found`);
        break;
      }
      await page.evaluate((y) => window.scrollTo(0, y), target);
      await wait(first ? FIRST_SETTLE_MS : label === "start" ? SETTLE_MS : 2200);
      first = false;

      const layout = await page.evaluate((id) => {
        const stage = document.getElementById("stage").getBoundingClientRect();
        const cardEl = document.querySelector(`#${id} [data-scene-card]`);
        const card = cardEl.getBoundingClientRect();
        // Content taller than the card would spill over the stage or under the chapter bar.
        const style = getComputedStyle(cardEl);
        const inner = cardEl.scrollHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom);
        const room = cardEl.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom);
        const content = [...cardEl.children].reduce((sum, el) => sum + el.getBoundingClientRect().height, 0);
        return { stageBottom: stage.bottom, cardTop: card.top, cardBottom: card.bottom, vh: window.innerHeight, overflow: Math.max(inner, content) - room };
      }, chapter);
      if (layout.cardTop < layout.stageBottom - 1) {
        problems.push(`[${vp.name}] ${chapter} ${label}: card (top ${layout.cardTop.toFixed(0)}) overlaps the stage (bottom ${layout.stageBottom.toFixed(0)})`);
      }
      if (layout.overflow > 24) {
        problems.push(`[${vp.name}] ${chapter} ${label}: card content is ${layout.overflow.toFixed(0)}px taller than the space between the stage and the chapter bar`);
      }
      if (layout.cardBottom > layout.vh + 1) {
        problems.push(`[${vp.name}] ${chapter} ${label}: card overflows the viewport (${layout.cardBottom.toFixed(0)} > ${layout.vh})`);
      }
      await save(page, `${vp.name}-${chapter}-${label}`);
    }
  }
  // A travel moment and the long-content state (stage slid away).
  if (!only) {
    for (const [name, id] of [["transit-pipeline", "pipeline"], ["builder-content", "builder"]]) {
      await page.evaluate(
        (name, id) => {
          const section = document.getElementById(id);
          if (name.startsWith("transit")) {
            const gap = section.nextElementSibling;
            const r = gap.getBoundingClientRect();
            window.scrollTo(0, r.top + window.scrollY + r.height / 2 - window.innerHeight * 0.55);
          } else {
            const scene = section.querySelector("[data-scene]");
            const r = scene.getBoundingClientRect();
            window.scrollTo(0, r.top + window.scrollY + r.height + window.innerHeight * 0.6);
          }
        },
        name,
        id,
      );
      await wait(SETTLE_MS);
      await save(page, `${vp.name}-${name}`);
    }
  }
  if (vp.name === "m390" && (!only || only.includes("overlay"))) await overlayCheck(page, vp, problems);
  await page.close();
}

/** Case-study overlay: open the first visible website card (intercepted route), capture, close. */
async function overlayCheck(page, vp, problems) {
  await page.evaluate(() => {
    const el = document.getElementById("websites");
    const stage = document.getElementById("stage");
    const offset = stage && getComputedStyle(stage).zIndex === "20" ? stage.offsetHeight : 64;
    if (el) window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - offset);
  });
  await wait(SETTLE_MS);
  await page.click("[data-card] h3 a");
  await wait(2500);
  const open = await page.evaluate(() => Boolean(document.querySelector('[role="dialog"][aria-labelledby="case-title"]')));
  if (!open) problems.push(`[${vp.name}] case-study overlay did not open`);
  await save(page, `${vp.name}-overlay`);
  await page.keyboard.press("Escape");
  await wait(2000);
  const url = new URL(page.url());
  if (url.pathname !== "/") problems.push(`[${vp.name}] closing the overlay left the URL at ${url.pathname}`);
  await save(page, `${vp.name}-overlay-closed`);
}

/** Flow prototype anchors (page order) and where the packet should rest in each. */
/**
 * Mobile "Data Core" prototype (/flow). Captures every hold (mid-hold), the approach to each
 * gate, the moment of passing through it (mid-morph) and one travel between two sites.
 * Stop times come from the page itself (window.__core). Checks at every hold:
 *   - the Core is centred (≤ 3px off the visible screen's centre),
 *   - no visible text crosses the Core's circle (satellites may graze its edge),
 *   - visible text stays clear of the fixed UI (top 56px / bottom 48px) and the screen edges,
 *   - visible text blocks don't overlap each other.
 */
async function corePass(browser, base, vp, problems) {
  const page = await browser.newPage();
  await page.setViewport({ width: vp.width, height: vp.height, deviceScaleFactor: 1, isMobile: vp.mobile, hasTouch: vp.mobile });
  page.on("console", (m) => ["error", "warn"].includes(m.type()) && problems.push(`[core ${vp.name}] ${m.type()}: ${m.text()}`));
  page.on("pageerror", (e) => problems.push(`[core ${vp.name}] pageerror: ${e.message}`));
  page.on("response", (r) => r.status() >= 400 && problems.push(`[core ${vp.name}] HTTP ${r.status()}: ${r.url()}`));
  await page.goto(`${base}/flow`, { waitUntil: "load" });
  await wait(6000);
  const plan = await page.evaluate(() => window.__core && { holds: window.__core.holds, gates: window.__core.gates, half: window.__core.morphHalf });
  if (!plan || !(await page.evaluate(() => Boolean(document.querySelector("canvas"))))) {
    problems.push(`[core ${vp.name}] engine or canvas not running`);
    await page.close();
    return;
  }

  const stops = [];
  plan.holds.forEach((h, i) => {
    stops.push({ name: `${String(stops.length + 1).padStart(2, "0")}-hold-${h.id}`, t: h.t, hold: true });
    const gate = plan.gates.find((g) => g > h.t && (i === plan.holds.length - 1 || g < plan.holds[i + 1].t));
    if (gate !== undefined) {
      stops.push({ name: `${String(stops.length + 1).padStart(2, "0")}-gate-approach`, t: gate - plan.half - 0.12 });
      stops.push({ name: `${String(stops.length + 1).padStart(2, "0")}-gate-pass-mid-morph`, t: gate });
      // The new shape just after its morph, before the chapter's effects run (e.g. Impact's "many people").
      stops.push({ name: `${String(stops.length + 1).padStart(2, "0")}-gate-arrived`, t: gate + plan.half + 0.02 });
    } else if (h.id === "websites.0") {
      stops.push({ name: `${String(stops.length + 1).padStart(2, "0")}-travel-site-switch`, t: (h.t + plan.holds[i + 1].t) / 2 });
    }
  });

  for (const stop of stops) {
    await page.evaluate((t) => window.scrollTo(0, window.__core.scrollFor(t)), stop.t);
    await wait(2600);
    const report = await page.evaluate(() => {
      const vh = window.innerHeight;
      const vw = window.innerWidth;
      const c = window.__core.circle();
      const out = { t: window.__core.t(), centre: { dx: c.x - vw / 2, dy: c.y - vh / 2 }, issues: [] };
      const opacityOf = (el) => {
        let o = 1;
        for (let n = el; n && n !== document.body; n = n.parentElement) o *= Number(getComputedStyle(n).opacity);
        return o;
      };
      // Text pieces: headings, paragraphs, list items, links and satellites inside visible beats.
      const pieces = [...document.querySelectorAll("[data-beat] :is(h1, h2, h3, p, li, a)")]
        .filter((el) => !el.closest(".sr-only") && !el.matches(".sr-only") && el.getClientRects().length && opacityOf(el) > 0.5)
        .filter((el) => !el.querySelector("p, li, a") || el.matches("[data-sat]"))
        .filter((el) => !el.closest("[data-sat]") || el.matches("[data-sat]"))
        .map((el) => ({ el, sat: el.matches("[data-sat]"), name: (el.textContent || "").trim().slice(0, 24), r: el.getBoundingClientRect() }))
        // Visually hidden copies for screen readers (1px boxes) aren't on screen.
        .filter(({ r }) => r.width > 2 && r.height > 2);
      const hitsCircle = (r, radius) => {
        const nx = Math.max(r.left, Math.min(c.x, r.right));
        const ny = Math.max(r.top, Math.min(c.y, r.bottom));
        return Math.hypot(nx - c.x, ny - c.y) < radius;
      };
      pieces.forEach(({ sat, name, r }) => {
        if (hitsCircle(r, c.r * (sat ? 0.82 : 1))) out.issues.push(`"${name}" covers the Core`);
        if (r.top < 56 || r.bottom > vh - 48 || r.left < 0 || r.right > vw) out.issues.push(`"${name}" outside the safe area (${r.top.toFixed(0)}–${r.bottom.toFixed(0)}, ${r.left.toFixed(0)}–${r.right.toFixed(0)})`);
      });
      pieces.forEach((a, i) =>
        pieces.slice(i + 1).forEach((b) => {
          if (a.el.contains(b.el) || b.el.contains(a.el)) return;
          if (a.r.top < b.r.bottom - 1 && a.r.bottom > b.r.top + 1 && a.r.left < b.r.right - 1 && a.r.right > b.r.left + 1) out.issues.push(`"${a.name}" overlaps "${b.name}"`);
        }),
      );
      return out;
    });
    const tag = `[core ${vp.name}] ${stop.name}`;
    if (Math.abs(report.t - stop.t) > 0.05) problems.push(`${tag}: timeline at t=${report.t.toFixed(2)}, expected ${stop.t.toFixed(2)}`);
    if (Math.abs(report.centre.dx) > 3 || Math.abs(report.centre.dy) > 3) problems.push(`${tag}: Core off centre by ${report.centre.dx.toFixed(1)}, ${report.centre.dy.toFixed(1)} px`);
    if (stop.hold) report.issues.forEach((issue) => problems.push(`${tag}: ${issue}`));
    await save(page, `core-${vp.name}-${stop.name}`);
  }
  await page.close();
}

/** Other pages (full-page screenshots): Classic View, a standalone case study, the 404. */
async function pagesPass(browser, base, problems) {
  const pages = [
    ["classic", "/classic"],
    ["work", "/work/localpilot"],
    ["404", "/this-page-does-not-exist"],
  ];
  for (const vp of [DESKTOP, PHONES[0]]) {
    const page = await browser.newPage();
    await page.setViewport({ width: vp.width, height: vp.height, deviceScaleFactor: 1, isMobile: vp.mobile, hasTouch: vp.mobile });
    page.on("pageerror", (e) => problems.push(`[${vp.name} pages] pageerror: ${e.message}`));
    page.on("response", (r) => {
      // The 404 page itself is expected to answer 404.
      if (r.status() >= 400 && !r.url().includes("this-page-does-not-exist")) problems.push(`[${vp.name} pages] HTTP ${r.status()}: ${r.url()}`);
    });
    for (const [name, path] of pages) {
      await page.goto(`${base}${path}`, { waitUntil: "load" });
      // Scroll through once so in-view effects (count-ups, reveals) have run before the full-page shot.
      await page.evaluate(async () => {
        for (let y = 0; y < document.body.scrollHeight; y += window.innerHeight / 2) {
          window.scrollTo(0, y);
          await new Promise((r) => setTimeout(r, 120));
        }
        window.scrollTo(0, 0);
      });
      await wait(1800);
      const file = `${OUT}/${vp.name}-page-${name}.png`;
      await page.screenshot({ path: file, fullPage: name !== "404" });
      console.log("saved", file);
    }
    await page.close();
  }
}

/** Reduced motion: no boot overlay, no 3D, no pinning, all content visible. */
async function reducedPass(browser, base, problems) {
  for (const vp of [DESKTOP, PHONES[0]]) {
    const page = await browser.newPage();
    await page.setViewport({ width: vp.width, height: vp.height, deviceScaleFactor: 1, isMobile: vp.mobile, hasTouch: vp.mobile });
    await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
    page.on("pageerror", (e) => problems.push(`[reduced ${vp.name}] pageerror: ${e.message}`));
    await page.goto(base, { waitUntil: "load" });
    await wait(3000);
    const state = await page.evaluate(() => ({
      canvas: Boolean(document.querySelector("canvas")),
      boot: Boolean(document.querySelector('[aria-labelledby="boot-title"]')),
      sticky: [...document.querySelectorAll("[data-scene-card]")].some((el) => getComputedStyle(el).position === "sticky"),
    }));
    if (state.canvas) problems.push(`[reduced ${vp.name}] a <canvas> mounted despite reduced motion`);
    if (state.boot) problems.push(`[reduced ${vp.name}] the boot overlay appeared despite reduced motion`);
    if (state.sticky) problems.push(`[reduced ${vp.name}] scene cards are still pinned (sticky)`);
    await page.screenshot({ path: `${OUT}/reduced-${vp.name}-top.png` });
    await page.evaluate(() => document.getElementById("impact")?.scrollIntoView());
    await wait(800);
    await page.screenshot({ path: `${OUT}/reduced-${vp.name}-impact.png` });
    console.log("saved", `${OUT}/reduced-${vp.name}-*.png`);
    await page.close();
  }
}

async function main() {
  let server;
  const base = args.url ?? `http://localhost:${PORT}`;
  if (!args.url) {
    if (!existsSync(".next/BUILD_ID")) throw new Error("No production build. Run `npm run build` first.");
    const busy = await fetch(base).then(
      () => true,
      () => false,
    );
    if (busy) throw new Error(`Port ${PORT} is already in use (an old server?). Stop it, or pass --url=${base}.`);
    server = spawn("npx", ["next", "start", "-p", String(PORT)], { shell: true, stdio: "ignore" });
    await waitFor(base);
  }

  mkdirSync(OUT, { recursive: true });
  const browser = await puppeteer.launch({
    executablePath: findChrome(),
    headless: true,
    args: ["--enable-unsafe-swiftshader", "--use-angle=swiftshader", "--ignore-gpu-blocklist", "--hide-scrollbars"],
  });
  const problems = [];

  try {
    if (args.flow) {
      // `npm run shots -- --flow`: only the mobile Data Core prototype.
      for (const vp of PHONES) await corePass(browser, base, vp, problems);
    } else {
      if (args.phones !== "only") await desktopPass(browser, base, problems);
      for (const vp of PHONES) await phonePass(browser, base, vp, problems);
      if (!only || only.includes("pages")) await pagesPass(browser, base, problems);
      if (!only) await reducedPass(browser, base, problems);
    }
  } finally {
    await browser.close();
    // Kill the whole process tree (npx → next start). On Windows this must happen before
    // killing the shell, or the server is orphaned and keeps the port.
    if (server && process.platform === "win32") {
      await new Promise((resolve) => spawn("taskkill", ["/pid", String(server.pid), "/T", "/F"], { shell: true }).on("exit", resolve));
    } else {
      server?.kill();
    }
  }

  console.log(problems.length ? `\n${problems.length} problem(s):\n${problems.join("\n")}` : "\nNo console errors or layout problems.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
