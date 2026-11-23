"use client";

import { useEffect, useRef } from "react";

const DURATION_MS = 1300;

/**
 * Counts every number inside `text` up from 0 when it scrolls into view ("3–5 min" →
 * "0–0 min" … "3–5 min"); the words around the numbers stay put. Text without numbers is shown
 * as-is. The server renders the final value (no-JS, reduced motion, screen readers).
 */
export function CountUp({ text }: { text: string }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    // split() with a capture group puts the numbers at odd indexes.
    const parts = text.split(/(\d+(?:\.\d+)?)/);
    if (!el || parts.length === 1 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const render = (k: number) => {
      el.textContent = parts.map((part, i) => (i % 2 ? String(Math.round(Number(part) * k)) : part)).join("");
    };
    let frame = 0;
    render(0);
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        const start = performance.now();
        const step = (now: number) => {
          const k = Math.min(1, (now - start) / DURATION_MS);
          render(1 - (1 - k) ** 3); // ease-out cubic
          if (k < 1) frame = requestAnimationFrame(step);
        };
        frame = requestAnimationFrame(step);
      },
      { threshold: 0.6 },
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      el.textContent = text;
    };
  }, [text]);

  return (
    <>
      <span ref={ref} aria-hidden="true" className="tabular-nums">
        {text}
      </span>
      <span className="sr-only">{text}</span>
    </>
  );
}
