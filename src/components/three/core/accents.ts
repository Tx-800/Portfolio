import type { ChapterKey } from "@/components/core/timeline";
import type { Palette } from "@/components/three/palette";

type Token = "gold" | "accent" | "accent-2" | "stale";

/** Each chapter's accent: its gate's colour and the tint of the streaks while you're in it. */
const ACCENTS: Record<ChapterKey, Token> = {
  spark: "gold",
  websites: "accent-2",
  cockpit: "gold",
  pipeline: "accent",
  watchtower: "stale",
  agents: "accent-2",
  impact: "gold",
  builder: "accent",
  contact: "accent-2",
};

export const accentOf = (palette: Palette, chapter: ChapterKey) => palette.color[ACCENTS[chapter]];
