import { Color } from "three";

const NAMES = [
  "bg",
  "surface",
  "surface-2",
  "border",
  "border-strong",
  "heading",
  "body",
  "muted",
  "accent",
  "accent-2",
  "gold",
  "stale",
] as const;

type Name = (typeof NAMES)[number];

export interface Palette {
  /** three.js colours (converted to linear working space automatically). */
  color: Record<Name, Color>;
  /** The raw CSS values, for drawing into 2D canvas textures. */
  css: Record<Name, string>;
}

/**
 * Reads the Solar Plasma tokens from the CSS variables in globals.css, so the 3D scene and the
 * HTML share one source of truth. Client-only (needs the DOM).
 */
export function readPalette(): Palette {
  const style = getComputedStyle(document.documentElement);
  const css = {} as Record<Name, string>;
  const color = {} as Record<Name, Color>;
  for (const name of NAMES) {
    // Magenta makes a missing token impossible to miss.
    css[name] = style.getPropertyValue(`--color-${name}`).trim() || "#ff00ff";
    color[name] = new Color(css[name]);
  }
  return { css, color };
}
