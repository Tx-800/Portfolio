/**
 * Visual check with the locally installed Chrome (headless, SwiftShader WebGL). Run after every
 * phase and look at the images before reporting.
 *
 *   npm run build && npm run shots
 *   npm run shots -- --only=watchtower,agents      only some chapters (plus "overlay", "pages")
 *   npm run shots -- --url=http://localhost:3000  use an already running server
 *   npm run shots -- --flow                       only the mobile Data Core (phones on "/")
 *   npm run shots -- --phones=only                skip the desktop journey
 *
 * Captures:
 *   desktop-<chapter>.png              1440×900, each chapter + two travel moments
 *   core-m390-<nn-moment>.png          phones (iPhone user agent) on "/" → the Data Core (rewritten to /m):
 *                                      every hold, gate approach / pass / arrival, a site switch;
 *                                      390×844 and 360×800 (core-m360-…)
 *   routing-<case>.png                 device routing: which experience "/" ends up showing for
 *                                      phones, desktops, iPads reporting as Mac, "Desktop site"
 *                                      mode, a resized window; deep link + case study from the Data Core
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
/** User agents for the device routing (proxy.ts). */
const UA = {
  iphone:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1",
  mac: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
};
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
  await page.setUserAgent(vp.mobile ? UA.iphone : UA.mac);
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
    // The terminal never moves on by itself: after typing, `help` and an unknown command it
    // must still be open, and again after a reload in the same session (lines shown instantly).
    const isOpen = () => page.evaluate(() => Boolean(document.querySelector('[aria-labelledby="boot-title"]')));
    const run = async (command) => {
      await page.type("#boot-input", command);
      await page.keyboard.press("Enter");
      await wait(600);
    };
    if (!only) {
      await save(page, `${vp.name}-boot`);
      await run("help");
      await save(page, `${vp.name}-boot-help`);
      await run("make coffee");
      await save(page, `${vp.name}-boot-unknown`);
      await wait(5000);
      if (!(await isOpen())) problems.push(`[${vp.name}] boot terminal closed by itself after typing`);
      await page.reload({ waitUntil: "load" });
      await wait(6000);
      if (!(await isOpen())) problems.push(`[${vp.name}] boot terminal closed by itself on a repeat visit`);
      await save(page, `${vp.name}-boot-repeat`);
    }
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

/**
 * Mobile "Data Core", as a phone gets it: "/" with an iPhone user agent (rewritten to /m). Captures every hold (mid-hold), the approach to each
 * gate, the moment of passing through it (mid-morph) and one travel between two sites.
 * Stop times come from the page itself (window.__core). Checks at every hold:
 *   - the Core is centred (≤ 3px off the visible screen's centre),
 *   - no visible text crosses the Core's circle (satellites may graze its edge),
 *   - visible text stays clear of the fixed UI (top 56px / bottom 48px) and the screen edges,
 *   - visible text blocks don't overlap each other.
 */
async function corePass(browser, base, vp, problems) {
  const page = await browser.newPage();
  await page.setUserAgent(UA.iphone);
  await page.setViewport({ width: vp.width, height: vp.height, deviceScaleFactor: 1, isMobile: vp.mobile, hasTouch: vp.mobile });
  page.on("console", (m) => ["error", "warn"].includes(m.type()) && problems.push(`[core ${vp.name}] ${m.type()}: ${m.text()}`));
  page.on("pageerror", (e) => problems.push(`[core ${vp.name}] pageerror: ${e.message}`));
  page.on("response", (r) => r.status() >= 400 && problems.push(`[core ${vp.name}] HTTP ${r.status()}: ${r.url()}`));
  await page.goto(base, { waitUntil: "load" });
  await wait(6000);
  const where = await experienceOf(page);
  if (where.path !== "/" || !where.core) problems.push(`[core ${vp.name}] "/" did not show the Data Core (path ${where.path})`);
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
    await page.setUserAgent(vp.mobile ? UA.iphone : UA.mac);
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
    await page.setUserAgent(vp.mobile ? UA.iphone : UA.mac);
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

/** What "/" ended up showing in this page. */
function experienceOf(page) {
  return page.evaluate(() => ({
    path: window.location.pathname,
    hash: window.location.hash,
    core: Boolean(document.querySelector("[data-core]")),
    journey: Boolean(document.getElementById("stage")),
    coreCanvas: Boolean(document.querySelector("[data-core-stage] canvas")),
    journeyCanvas: Boolean(document.querySelector("#stage canvas")),
  }));
}

/** Is this the expected experience, with only its own 3D loaded? */
function checkExperience(tag, got, want, problems) {
  if (got.path !== "/") problems.push(`[routing ${tag}] URL is ${got.path}, expected "/"`);
  const ok =
    want === "mobile"
      ? got.core && !got.journey && got.coreCanvas && !got.journeyCanvas
      : got.journey && !got.core && got.journeyCanvas && !got.coreCanvas;
  if (!ok) problems.push(`[routing ${tag}] expected the ${want} experience, got ${JSON.stringify(got)}`);
}

/**
 * Device routing (proxy.ts + DeviceSwitch). Each case runs in a fresh browser context (no
 * device cookie): the server guesses from the user agent, the browser corrects it, and "/"
 * must end up showing the right experience, URL unchanged, one 3D world only.
 */
async function routingPass(browser, base, problems) {
  const cases = [
    { name: "desktop", ua: UA.mac, w: 1440, h: 900, touch: false, want: "desktop" },
    { name: "phone", ua: UA.iphone, w: 390, h: 844, touch: true, want: "mobile" },
    { name: "ipad-reports-mac", ua: UA.mac, w: 1366, h: 1024, touch: true, want: "mobile" },
    { name: "phone-desktop-site", ua: UA.mac, w: 980, h: 1900, touch: true, want: "mobile" },
    { name: "phone-ua-big-screen", ua: UA.iphone, w: 1440, h: 900, touch: false, want: "desktop" },
    { name: "resized-window", ua: UA.mac, w: 1440, h: 900, touch: false, want: "mobile", resize: { w: 800, h: 900 } },
  ];
  const open = async (c) => {
    const context = await browser.createBrowserContext();
    const page = await context.newPage();
    await page.setUserAgent(c.ua);
    await page.setViewport({ width: c.w, height: c.h, deviceScaleFactor: 1, isMobile: c.touch, hasTouch: c.touch });
    page.on("pageerror", (e) => problems.push(`[routing ${c.name}] pageerror: ${e.message}`));
    page.on("response", (r) => r.status() >= 400 && problems.push(`[routing ${c.name}] HTTP ${r.status()}: ${r.url()}`));
    return { context, page };
  };

  for (const c of cases) {
    const { context, page } = await open(c);
    await page.goto(base, { waitUntil: "load" });
    await wait(7000);
    if (c.resize) {
      await page.setViewport({ width: c.resize.w, height: c.resize.h, deviceScaleFactor: 1 });
      await wait(7000);
    }
    checkExperience(c.name, await experienceOf(page), c.want, problems);
    await save(page, `routing-${c.name}`);
    await context.close();
  }

  // Phone: client-side navigation back to "/#cockpit" from a case study page (RSC request
  // through the proxy) lands in the Data Core at the start of that chapter.
  {
    const c = { name: "phone-deep-link", ua: UA.iphone, w: 390, h: 844, touch: true };
    const { context, page } = await open(c);
    await page.goto(`${base}/work/localpilot`, { waitUntil: "load" });
    await wait(2500);
    await page.click('a[href="/#cockpit"]');
    await wait(7000);
    const got = await experienceOf(page);
    checkExperience(c.name, got, "mobile", problems);
    if (got.hash !== "#cockpit") problems.push(`[routing ${c.name}] hash is "${got.hash}"`);
    const off = await page.evaluate(() => Math.abs(window.__core.t() - window.__core.holds.find((h) => h.id === "cockpit.intro").t));
    if (off > 0.3) problems.push(`[routing ${c.name}] landed ${off.toFixed(2)} screens away from the cockpit chapter`);
    await save(page, `routing-${c.name}`);

    // Case study from a Data Core pill: opens as the overlay, Esc returns to "/".
    await page.evaluate(() => {
      const hold = window.__core.holds.find((h) => h.id === "websites.0");
      window.scrollTo(0, window.__core.scrollFor(hold.t));
    });
    await wait(3000);
    const href = await page.evaluate(() => {
      const link = [...document.querySelectorAll('[data-beat] a[href^="/work/"]')].find(
        (a) => getComputedStyle(a.closest("[data-beat]")).visibility === "visible",
      );
      link?.click();
      return link?.getAttribute("href");
    });
    await wait(2500);
    const dialog = await page.evaluate(() => Boolean(document.querySelector('[role="dialog"][aria-labelledby="case-title"]')));
    if (!href || !dialog) problems.push(`[routing phone-overlay] case study did not open as an overlay (${href})`);
    await save(page, "routing-phone-overlay");
    await page.keyboard.press("Escape");
    await wait(2500);
    const after = await experienceOf(page);
    if (after.path !== "/" || !after.core) problems.push(`[routing phone-overlay] after closing: ${JSON.stringify(after)}`);
    await context.close();
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
      // `npm run shots -- --flow`: only the mobile Data Core.
      for (const vp of PHONES) await corePass(browser, base, vp, problems);
    } else {
      if (args.phones !== "only") await desktopPass(browser, base, problems);
      if (!only || only.includes("routing")) await routingPass(browser, base, problems);
      if (!only) for (const vp of PHONES) await corePass(browser, base, vp, problems);
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
