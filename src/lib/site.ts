import { profile } from "@/data/content";

/**
 * The one place to change the production domain.
 * Set NEXT_PUBLIC_SITE_URL in Vercel (the *.vercel.app URL for now, a custom domain later).
 */
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const SITE_TITLE = `${profile.name} — ${profile.role}`;
export const SITE_DESCRIPTION = profile.summary;

/** Matches --color-bg; used for the browser UI colour. */
export const THEME_COLOR = "#0B0612";
