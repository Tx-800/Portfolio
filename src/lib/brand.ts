/**
 * Solar Plasma colours for generated images (OG image, Apple icon), which can't read CSS
 * variables. MUST match the @theme tokens in src/app/globals.css.
 */
export const BRAND = {
  bg: "#0B0612",
  surface: "#140A1C",
  borderStrong: "#3A2840",
  heading: "#FFF4EC",
  body: "#C9B8C4",
  muted: "#A3929E",
  accent: "#FF6B2C",
  accent2: "#FF2E88",
  gold: "#FFC44D",
} as const;

/** The data packet: a sphere lit from the top-left in the signature gradient. */
export const PACKET_GRADIENT = `radial-gradient(circle at 34% 30%, ${BRAND.gold} 0%, ${BRAND.accent} 45%, ${BRAND.accent2} 88%)`;
