"use client";

import { useLenis } from "lenis/react";
import { XIcon } from "lucide-react";
import { motion, useDragControls, type PanInfo } from "motion/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { uiText } from "@/data/content";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { uiStore } from "@/store/ui";

const EASE = [0.22, 1, 0.36, 1] as const;
/** Swipe-down distance (px) or speed (px/s) that closes the mobile sheet. */
const DISMISS_OFFSET = 120;
const DISMISS_VELOCITY = 600;
const FOCUSABLE = 'a[href], button:not([disabled]), input, textarea, select, [tabindex]:not([tabindex="-1"])';

/**
 * Case-study overlay (rendered in the @modal slot when a card is clicked).
 *  - Opens with a shared-layout morph from the card (same layoutId `case-<slug>`), then fades the
 *    content in, so text never stretches during the morph.
 *  - Desktop: centred panel over a blurred backdrop. Mobile: full-screen sheet; drag the top bar
 *    down (or tap ×) to close.
 *  - Accessible dialog: focus moves in and is trapped, Esc closes, the page behind is inert, and
 *    focus returns to the card. Lenis stops and the 3D pauses while it's open.
 *  - Closing = router.back(), so the URL and browser history stay in sync and the journey
 *    underneath (still mounted) is exactly where the visitor left it.
 */
export function CaseStudyModal({ slug, children }: { slug: string; children: ReactNode }) {
  const router = useRouter();
  const lenis = useLenis();
  const mobile = useMediaQuery("(max-width: 767px)");
  const dragControls = useDragControls();
  const closeButton = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const [closing, setClosing] = useState(false);

  // Lock the page behind the overlay and hand focus to the dialog.
  useEffect(() => {
    const opener = document.activeElement;
    const root = document.documentElement;
    const behind = [document.querySelector("header"), document.getElementById("main"), document.querySelector("footer")];
    uiStore.setState({ overlayOpen: true });
    root.style.overflow = "hidden";
    behind.forEach((el) => el?.setAttribute("inert", ""));
    closeButton.current?.focus({ preventScroll: true });

    return () => {
      uiStore.setState({ overlayOpen: false });
      root.style.overflow = "";
      behind.forEach((el) => el?.removeAttribute("inert"));
      // Back to the card that opened it (or whatever had focus before).
      const card = document.querySelector<HTMLElement>(`[data-card="${slug}"] a`);
      const target = card ?? (opener instanceof HTMLElement ? opener : null);
      target?.focus({ preventScroll: true });
    };
  }, [slug]);

  useEffect(() => {
    lenis?.stop();
    return () => lenis?.start();
  }, [lenis]);

  // Close: fade the content (desktop) or slide the sheet away (mobile), then go back.
  const close = useCallback(() => setClosing(true), []);
  useEffect(() => {
    if (!closing) return;
    const id = setTimeout(() => router.back(), mobile ? 300 : 140);
    return () => clearTimeout(id);
  }, [closing, mobile, router]);

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.stopPropagation();
      close();
      return;
    }
    if (event.key !== "Tab" || !panel.current) return;
    // Focus trap: wrap Tab / Shift+Tab inside the dialog.
    const items = Array.from(panel.current.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => el.offsetParent !== null);
    if (items.length === 0) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function onDragEnd(_: unknown, info: PanInfo) {
    if (info.offset.y > DISMISS_OFFSET || info.velocity.y > DISMISS_VELOCITY) close();
  }

  return (
    <div className="fixed inset-0 z-50" onKeyDown={onKeyDown}>
      <motion.div
        aria-hidden="true"
        className="absolute inset-0 bg-bg/75 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: closing ? 0 : 1 }}
        transition={{ duration: 0.35 }}
        onClick={close}
      />

      <motion.div
        ref={panel}
        layoutId={`case-${slug}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="case-title"
        drag={mobile ? "y" : false}
        dragControls={dragControls}
        dragListener={false}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0, bottom: 0.9 }}
        onDragEnd={onDragEnd}
        animate={closing && mobile ? { y: "100%" } : { y: 0 }}
        transition={{ layout: { duration: 0.55, ease: EASE }, y: { duration: 0.3, ease: EASE } }}
        style={{ borderRadius: mobile ? 0 : 28 }}
        className="absolute inset-0 flex flex-col overflow-hidden bg-surface shadow-card md:inset-x-0 md:top-6 md:bottom-6 md:mx-auto md:w-[min(1120px,calc(100%-3rem))] md:border md:border-border"
      >
        {/* Top bar: close button; on mobile also the drag handle for swipe-to-close. */}
        <div
          onPointerDown={(e) => mobile && dragControls.start(e)}
          className="relative flex h-16 shrink-0 touch-none items-center justify-between border-b border-border/70 px-4 sm:px-6 md:touch-auto"
        >
          <span aria-hidden="true" className="absolute top-2 left-1/2 h-1 w-10 -translate-x-1/2 rounded-full bg-border-strong md:hidden" />
          <span className="label-mono text-muted md:hidden">{uiText.caseStudy.swipeHint}</span>
          <span className="hidden md:block" />
          <button
            ref={closeButton}
            type="button"
            onClick={close}
            className="grid size-11 place-items-center rounded-full border border-border-strong text-heading transition-colors hover:border-accent/70"
          >
            <XIcon aria-hidden="true" className="size-5" />
            <span className="sr-only">{uiText.caseStudy.close}</span>
          </button>
        </div>

        {/* Content fades in after the morph, so nothing looks stretched mid-animation. */}
        <motion.div
          data-lenis-prevent
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain"
          initial={{ opacity: 0 }}
          animate={{ opacity: closing ? 0 : 1 }}
          transition={closing ? { duration: 0.14 } : { duration: 0.35, delay: 0.2 }}
        >
          {children}
        </motion.div>
      </motion.div>
    </div>
  );
}
