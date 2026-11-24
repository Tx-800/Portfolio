"use client";

import { useLenis } from "lenis/react";
import { AnimatePresence, motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { Terminal } from "@/components/ui/Terminal";
import { boot, type ChapterId } from "@/data/content";
import { scrollToElement } from "@/lib/scrollTo";
import { uiStore } from "@/store/ui";

type Mode = "full" | "short" | "none";

const SESSION_KEY = "yg-boot-seen";
/** Typing speed: characters per tick, ms per tick, pause between lines. */
const CHARS_PER_TICK = 2;
const TICK_MS = 16;
const LINE_PAUSE_MS = 160;
/** Repeat visits: the terminal shows complete and hands off on its own after this delay. */
const SHORT_AUTOSTART_MS = 1100;
/** How long the overlay takes to dissolve; the camera flight starts part-way through. */
const EXIT_S = 0.9;
const FLIGHT_DELAY_MS = 250;

const COMMAND_TARGETS: Record<string, ChapterId> = {
  about: "spark",
  projects: "websites",
  agents: "agents",
  contact: "contact",
};

let decided: Mode | undefined;

/**
 * Show the boot terminal? Decided once per page load on the client:
 *  - none: reduced motion, a deep link (#chapter), or already scrolled down
 *  - short: seen earlier this session → complete terminal, auto hand-off after ~1 s
 *  - full: first visit → typed out
 */
function decide(): Mode {
  if (decided) return decided;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce || window.location.hash || window.scrollY > 40) return (decided = "none");
  let seen = false;
  try {
    seen = sessionStorage.getItem(SESSION_KEY) === "1";
    sessionStorage.setItem(SESSION_KEY, "1");
  } catch {
    // Storage blocked: treat as a first visit.
  }
  return (decided = seen ? "short" : "full");
}

/** Will the boot terminal cover the page on this load? (Scroll reveals wait for it.) */
export function bootWillShow(): boolean {
  return decide() !== "none";
}

const noop = () => () => {};

/**
 * Chapter 0, the cinematic way in: a full-screen terminal types its boot lines while the 3D
 * loads behind it, then accepts commands. "Start the journey" dissolves the terminal and the
 * camera flies from the Boot station to The Spark.
 * (The static BootSection in the page stays as the no-JS / reduced-motion version.)
 */
export function BootOverlay() {
  const mode = useSyncExternalStore(noop, decide, () => "none" as Mode);
  const [open, setOpen] = useState(true);
  const [progress, setProgress] = useState({ line: 0, chars: 0, done: false });
  const [history, setHistory] = useState<string[]>([]);
  const lenis = useLenis();
  const router = useRouter();
  const leaving = useRef(false);
  const visible = mode !== "none" && open;
  const ready = mode === "short" || progress.done;

  // Typewriter: a few characters every frame, a short pause between lines.
  useEffect(() => {
    if (mode !== "full") return;
    let line = 0;
    let chars = 0;
    let id: ReturnType<typeof setTimeout>;
    const tick = () => {
      const text = boot.lines[line];
      if (chars < text.length) {
        chars = Math.min(text.length, chars + CHARS_PER_TICK);
        setProgress({ line, chars, done: false });
        id = setTimeout(tick, TICK_MS);
      } else if (line < boot.lines.length - 1) {
        line += 1;
        chars = 0;
        setProgress({ line, chars, done: false });
        id = setTimeout(tick, LINE_PAUSE_MS);
      } else {
        setProgress({ line, chars, done: true });
      }
    };
    id = setTimeout(tick, 350);
    return () => clearTimeout(id);
  }, [mode]);

  // While open: freeze the page (Lenis + touch scroll) and make everything behind it inert.
  useEffect(() => {
    if (!visible) return;
    uiStore.setState({ bootOpen: true });
    lenis?.stop();
    const root = document.documentElement;
    root.style.overflow = "hidden";
    const behind = [document.querySelector("header"), document.getElementById("main"), document.querySelector("footer")];
    behind.forEach((el) => el?.setAttribute("inert", ""));
    return () => {
      root.style.overflow = "";
      behind.forEach((el) => el?.removeAttribute("inert"));
      uiStore.setState({ bootOpen: false });
    };
  }, [visible, lenis]);

  const leave = useCallback(
    (target: ChapterId = "spark") => {
      if (leaving.current) return;
      leaving.current = true;
      decided = "none"; // client-side navigations back to "/" skip the boot
      setOpen(false);
      uiStore.setState({ bootDone: true });
      // Start the camera flight while the terminal is still dissolving.
      setTimeout(() => {
        lenis?.start();
        const el = document.getElementById(target);
        if (el) scrollToElement(el, lenis, 2.4);
      }, FLIGHT_DELAY_MS);
    },
    [lenis],
  );

  // Repeat visits hand off automatically, unless the visitor starts typing.
  useEffect(() => {
    if (mode !== "short") return;
    const id = setTimeout(() => leave("spark"), SHORT_AUTOSTART_MS);
    const cancel = () => clearTimeout(id);
    window.addEventListener("keydown", cancel, { once: true });
    window.addEventListener("pointerdown", cancel, { once: true });
    return () => {
      cancel();
      window.removeEventListener("keydown", cancel);
      window.removeEventListener("pointerdown", cancel);
    };
  }, [mode, leave]);

  // Esc = start the journey.
  useEffect(() => {
    if (!visible) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && leave("spark");
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [visible, leave]);

  function runCommand(raw: string) {
    const command = raw.trim().toLowerCase();
    const echo = `> ${raw.trim()}`;
    if (!command) return leave("spark");
    if (command === "help") {
      setHistory((h) => [...h, echo, ...boot.commands.map((c) => `${c.name.padEnd(10)} ${c.description}`)]);
      return;
    }
    if (command === "sudo hire") {
      setHistory((h) => [...h, echo, boot.messages.sudoHire]);
      setTimeout(() => leave("contact"), 700);
      return;
    }
    if (command === "classic") {
      setHistory((h) => [...h, echo, boot.messages.navigating]);
      setOpen(false);
      uiStore.setState({ bootDone: true });
      router.push("/classic");
      return;
    }
    const target = COMMAND_TARGETS[command];
    if (target) {
      setHistory((h) => [...h, echo, boot.messages.navigating]);
      leave(target);
      return;
    }
    setHistory((h) => [...h, echo, boot.messages.notFound.replace("{cmd}", raw.trim())]);
  }

  // Lines typed so far (all of them in short mode).
  const lines =
    mode === "full" && !progress.done
      ? [...boot.lines.slice(0, progress.line), boot.lines[progress.line].slice(0, progress.chars)]
      : [...boot.lines];
  const fine = typeof window !== "undefined" && window.matchMedia("(pointer: fine)").matches;

  if (mode === "none" || typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          key="boot"
          role="dialog"
          aria-modal="true"
          aria-labelledby="boot-title"
          className="fixed inset-0 z-[60] flex items-center justify-center bg-bg/92 px-4 backdrop-blur-md"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: EXIT_S, ease: [0.65, 0, 0.35, 1] } }}
        >
          <div aria-hidden="true" className="ambient-glow pointer-events-none absolute inset-0 opacity-70" />
          <motion.div
            className="relative flex w-full justify-center"
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } }}
            // Hand-off: the terminal lifts towards the viewer and dissolves into the scene.
            exit={{ opacity: 0, scale: 1.08, filter: "blur(10px)", transition: { duration: EXIT_S * 0.75, ease: [0.22, 1, 0.36, 1] } }}
          >
            <Terminal
              lines={lines}
              history={history}
              ready={ready}
              focusInput={fine}
              onCommand={runCommand}
              onStart={() => leave("spark")}
              onSkip={() => leave("websites")}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
