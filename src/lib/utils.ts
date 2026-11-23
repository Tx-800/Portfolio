import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * tailwind-merge must know our custom tokens from globals.css (@theme), otherwise it treats
 * e.g. `text-metric` (a font size) as a text colour and drops `text-gold` next to it.
 */
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      text: ["display", "title", "subtitle", "metric", "body", "label"],
      color: ["bg", "surface", "surface-2", "border", "border-strong", "heading", "body", "muted", "accent", "accent-2", "gold", "stale"],
      radius: ["card"],
      shadow: ["card", "glow", "glow-strong"],
    },
  },
});

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function isExternal(href: string): boolean {
  return /^(https?:|mailto:)/.test(href);
}
