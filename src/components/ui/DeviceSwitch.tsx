"use client";

import { useEffect } from "react";
import { DEVICE_COOKIE, MOBILE_QUERY, MOBILE_ROUTE, screenDevice, type Device } from "@/lib/device";

/** Rotations and window drags fire many changes; act once things settle. */
const SETTLE_MS = 400;
/** Safety net: never bounce between the two experiences more than this per minute. */
const MAX_SWITCHES = 2;
const SWITCH_KEY = "yg-device-switches";

/**
 * The browser's double-check of the server's guess (see proxy.ts). Rendered by both "/"
 * (desktop journey) and /m (Data Core), each telling it which experience it is.
 *
 * If the real screen wants the other experience, it writes the device cookie and reloads "/":
 * the proxy then serves the right page and the URL never changes. The same happens later if
 * the screen crosses the line (rotation, resize, unfolding a foldable).
 * The 3D loaders check the screen themselves before mounting, so a page that is about to
 * switch never starts downloading its own 3D: the two experiences never load together.
 */
export function DeviceSwitch({ rendered }: { rendered: Device }) {
  useEffect(() => {
    const media = window.matchMedia(MOBILE_QUERY);
    let timer = 0;

    const check = () => {
      const wanted = screenDevice();
      if (wanted === rendered || !allowSwitch()) return;
      document.cookie = `${DEVICE_COOKIE}=${wanted}; path=/; max-age=${60 * 60 * 24 * 30}; samesite=lax`;
      // /m opened directly on a desktop goes to "/" (the proxy picks the page from the cookie).
      const path = window.location.pathname === MOBILE_ROUTE ? "/" : window.location.pathname;
      window.location.replace(path + window.location.search + window.location.hash);
    };
    const onChange = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(check, SETTLE_MS);
    };

    check();
    media.addEventListener("change", onChange);
    return () => {
      media.removeEventListener("change", onChange);
      window.clearTimeout(timer);
    };
  }, [rendered]);

  return null;
}

/** Counts switches in this tab over the last minute (sessionStorage may be blocked: then allow). */
function allowSwitch(): boolean {
  try {
    const now = Date.now();
    const recent = (JSON.parse(sessionStorage.getItem(SWITCH_KEY) ?? "[]") as number[]).filter((t) => now - t < 60_000);
    if (recent.length >= MAX_SWITCHES) return false;
    sessionStorage.setItem(SWITCH_KEY, JSON.stringify([...recent, now]));
  } catch {
    // Storage blocked: the cookie alone still prevents a loop (the proxy honours it).
  }
  return true;
}
