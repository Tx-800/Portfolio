/**
 * Which experience a visitor gets on "/": the desktop journey or the mobile Data Core (/m).
 * Shared by the server (proxy.ts: first guess from the user agent) and the browser
 * (DeviceSwitch: checks the real screen and corrects the guess). No React, no globals: the
 * proxy imports this too.
 */

export type Device = "mobile" | "desktop";

/** Set by the browser when the server's guess was wrong; the proxy trusts it over the user agent. */
export const DEVICE_COOKIE = "yg-device";

/** Phones, small tablets, any touch-first screen (iPads in landscape too). Motion preference is NOT part of it. */
export const MOBILE_QUERY = "(max-width: 1023.98px), (pointer: coarse)";

/** The internal route that holds the mobile experience. Visitors never see this URL. */
export const MOBILE_ROUTE = "/m";

export function isDevice(value: unknown): value is Device {
  return value === "mobile" || value === "desktop";
}

/** Server guess: `device.type` from Next's userAgent() helper ("mobile", "tablet", … or undefined for desktops). */
export function deviceFromUserAgent(type: string | undefined): Device {
  return type === "mobile" || type === "tablet" ? "mobile" : "desktop";
}

/** Browser truth: what this screen should get right now. */
export function screenDevice(): Device {
  return window.matchMedia(MOBILE_QUERY).matches ? "mobile" : "desktop";
}
