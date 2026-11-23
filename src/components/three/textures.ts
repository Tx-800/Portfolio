import { CanvasTexture, SRGBColorSpace } from "three";
import type { Palette } from "@/components/three/palette";

let glowTexture: CanvasTexture | undefined;

/** Soft radial falloff (white → transparent), shared by every glow sprite and dust particle. */
export function getGlowTexture(): CanvasTexture {
  if (glowTexture) return glowTexture;
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(0.25, "rgba(255,255,255,0.55)");
    g.addColorStop(0.6, "rgba(255,255,255,0.12)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
  }
  glowTexture = new CanvasTexture(canvas);
  return glowTexture;
}

/** Font families from next/font (hashed names), read from the CSS variables on <html>. */
function fontFamily(variable: string, fallback: string): string {
  const value = getComputedStyle(document.documentElement).getPropertyValue(variable).trim();
  return value || fallback;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fill();
}

/**
 * Placeholder "website screenshot" for a browser panel: a stylised page with the project's
 * title. Replaced by the real screenshot once it's added (Phase 6).
 */
export function createScreenTexture(title: string, label: string, palette: Palette, variant: number): CanvasTexture {
  const W = 1024;
  const H = 640;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  const { css } = palette;
  const display = fontFamily("--font-sora", "sans-serif");
  const mono = fontFamily("--font-plex-mono", "monospace");

  if (ctx) {
    // Page background with a warm glow in one corner (varies per panel).
    ctx.fillStyle = css.surface;
    ctx.fillRect(0, 0, W, H);
    const gx = [W * 0.85, W * 0.15, W * 0.7][variant % 3];
    const glow = ctx.createRadialGradient(gx, H * 0.2, 0, gx, H * 0.2, W * 0.6);
    glow.addColorStop(0, `${css.accent}55`);
    glow.addColorStop(0.5, `${css["accent-2"]}22`);
    glow.addColorStop(1, "transparent");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);

    // Nav bar.
    ctx.fillStyle = css.heading;
    roundRect(ctx, 56, 44, 120, 22, 11);
    ctx.fillStyle = css["border-strong"];
    for (let i = 0; i < 4; i++) roundRect(ctx, W - 420 + i * 92, 50, 64, 10, 5);

    // Label + title.
    ctx.fillStyle = css.gold;
    ctx.font = `500 22px ${mono}`;
    ctx.fillText(label.toUpperCase(), 56, 190);
    ctx.fillStyle = css.heading;
    ctx.font = `700 74px ${display}`;
    const words = title.split(" ");
    const lines = words.length > 2 ? [words.slice(0, 2).join(" "), words.slice(2).join(" ")] : [title];
    lines.forEach((line, i) => ctx.fillText(line, 56, 280 + i * 84));

    // Gradient CTA pill.
    const cta = ctx.createLinearGradient(56, 0, 276, 0);
    cta.addColorStop(0, css.accent);
    cta.addColorStop(1, css["accent-2"]);
    ctx.fillStyle = cta;
    roundRect(ctx, 56, H - 190, 220, 54, 27);

    // Card row.
    ctx.fillStyle = css["surface-2"];
    for (let i = 0; i < 3; i++) roundRect(ctx, W - 520 + i * 160, H - 210, 140, 150, 18);
  }

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

export interface LabelTexture {
  texture: CanvasTexture;
  /** width / height, for sizing the sprite. */
  aspect: number;
}

/**
 * A crisp text label for sprites (decorative only: the same words always exist in the HTML).
 * `pill` draws a dark rounded background with a coloured border.
 */
export function createLabelTexture(
  text: string,
  color: string,
  options: { font?: "mono" | "sans"; pill?: { fill: string; border: string }; uppercase?: boolean } = {},
): LabelTexture {
  const H = 96;
  const family = options.font === "sans" ? fontFamily("--font-manrope", "sans-serif") : fontFamily("--font-plex-mono", "monospace");
  const font = `${options.font === "sans" ? 600 : 500} 44px ${family}`;
  const label = options.uppercase === false ? text : text.toUpperCase();

  const spacing = options.font === "sans" ? "0px" : "4px";
  const measure = document.createElement("canvas").getContext("2d");
  if (measure) {
    measure.font = font;
    // Measure with the same letter spacing we draw with, or the text gets clipped.
    measure.letterSpacing = spacing;
  }
  const textWidth = Math.ceil(measure?.measureText(label).width ?? label.length * 26);
  const padX = options.pill ? 36 : 8;
  const W = textWidth + padX * 2;

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    if (options.pill) {
      ctx.fillStyle = options.pill.fill;
      ctx.strokeStyle = options.pill.border;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(2, 2, W - 4, H - 4, (H - 4) / 2);
      ctx.fill();
      ctx.stroke();
    }
    ctx.font = font;
    ctx.letterSpacing = spacing;
    ctx.fillStyle = color;
    ctx.textBaseline = "middle";
    ctx.fillText(label, padX, H / 2 + 2);
  }

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 4;
  return { texture, aspect: W / H };
}

/** Tiny dashboard (bars + trend line) for the cockpit screens. Drawn light-on-dark; tinted by material colour. */
export function createDashboardTexture(seed: number): CanvasTexture {
  const W = 256;
  const H = 160;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  // Deterministic pseudo-random so every reload looks the same.
  let s = seed * 9301 + 49297;
  const rand = () => ((s = (s * 9301 + 49297) % 233280) / 233280);

  if (ctx) {
    ctx.fillStyle = "#0d0d0d";
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.fillRect(16, 16, 70, 8);
    ctx.fillStyle = "rgba(255,255,255,0.35)";
    ctx.fillRect(16, 30, 44, 5);
    for (let i = 0; i < 7; i++) {
      const h = 20 + rand() * 60;
      ctx.fillStyle = `rgba(255,255,255,${0.35 + rand() * 0.5})`;
      ctx.fillRect(16 + i * 18, H - 18 - h, 11, h);
    }
    ctx.strokeStyle = "rgba(255,255,255,0.95)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let i = 0; i <= 6; i++) {
      const x = 150 + i * 15;
      const y = H - 40 - rand() * 70 - i * 4;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}
