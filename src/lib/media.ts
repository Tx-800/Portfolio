// Server-only helpers (uses the file system). Never import from a client component.
import { existsSync } from "node:fs";
import path from "node:path";
import type { Project } from "@/data/content";

const EXTENSIONS = [".png", ".webp", ".jpg", ".jpeg"];

/**
 * Returns the public URL of an image if the file is actually in /public, otherwise null.
 * The same file name with .png, .webp or .jpg is accepted, so `hero.webp` works for a
 * `hero.png` path. Checked at build/request time, so missing files never cause a 404.
 */
export function resolveImage(src?: string): string | null {
  if (!src) return null;
  const base = src.replace(/\.(png|webp|jpe?g)$/i, "");
  for (const ext of EXTENSIONS) {
    const candidate = `${base}${ext}`;
    if (existsSync(path.join(process.cwd(), "public", candidate))) return candidate;
  }
  return null;
}

/** The project's hero screenshot (first screenshot in its media list), if the file exists. */
export function resolveHero(project: Project): string | null {
  return resolveImage(project.caseStudy.media.find((m) => m.kind === "screenshot")?.src);
}
