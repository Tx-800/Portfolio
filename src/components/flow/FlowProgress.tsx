"use client";

import { useEffect, useRef } from "react";

/**
 * The only navigation chrome on the flow page: a thin gradient line under the header showing
 * how far down the page you are. One style write per scroll event (passive), no React state.
 */
export function FlowProgress() {
  const bar = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const update = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (bar.current) bar.current.style.transform = `scaleX(${max > 0 ? window.scrollY / max : 0})`;
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);
  return <div ref={bar} aria-hidden="true" className="bg-signature fixed inset-x-0 top-16 z-40 h-0.5 origin-left scale-x-0" />;
}
