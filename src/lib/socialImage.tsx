// Server-only: renders the Solar Plasma social card (Open Graph / Twitter). Reads local fonts.
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { profile } from "@/data/content";
import { BRAND, PACKET_GRADIENT } from "@/lib/brand";

export const SOCIAL_SIZE = { width: 1200, height: 630 };

const font = (pkg: string, file: string) => readFile(join(process.cwd(), "node_modules/@fontsource", pkg, "files", file));

// Read once at module load (build time), so the images are generated statically, not per request.
const [sora, manrope, mono] = await Promise.all([
  font("sora", "sora-latin-700-normal.woff"),
  font("manrope", "manrope-latin-500-normal.woff"),
  font("ibm-plex-mono", "ibm-plex-mono-latin-500-normal.woff"),
]);

/**
 * 1200×630 card: "yogesh*" wordmark, the headline with its accent words, the role, and the
 * gradient packet with an orbit ring. All words come from content.ts.
 */
export function renderSocialImage(): ImageResponse {

  const accentAt = profile.headline.indexOf(profile.headlineAccent);
  const lead = accentAt >= 0 ? profile.headline.slice(0, accentAt) : profile.headline;
  const accent = accentAt >= 0 ? profile.headlineAccent : "";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          background: BRAND.bg,
          color: BRAND.heading,
          fontFamily: "Manrope",
          overflow: "hidden",
        }}
      >
        {/* Ambient glows. */}
        <div style={{ position: "absolute", left: -200, top: -260, width: 760, height: 760, borderRadius: 999, background: `radial-gradient(circle, ${BRAND.accent}55, transparent 65%)` }} />
        <div style={{ position: "absolute", right: -160, bottom: -300, width: 820, height: 820, borderRadius: 999, background: `radial-gradient(circle, ${BRAND.accent2}44, transparent 65%)` }} />

        {/* Packet + orbit ring. */}
        <div style={{ position: "absolute", right: 70, top: 150, width: 360, height: 360, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ position: "absolute", width: 380, height: 120, borderRadius: 999, border: `3px solid ${BRAND.gold}`, transform: "rotate(-22deg)", opacity: 0.9 }} />
          <div style={{ width: 190, height: 190, borderRadius: 999, background: PACKET_GRADIENT, boxShadow: `0 0 120px 30px ${BRAND.accent}66` }} />
        </div>

        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "64px 72px", width: 760 }}>
          <div style={{ display: "flex", fontFamily: "Sora", fontSize: 44, letterSpacing: -1.5 }}>
            yogesh<span style={{ color: BRAND.accent }}>*</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", flexWrap: "wrap", fontFamily: "Sora", fontSize: 64, lineHeight: 1.04, letterSpacing: -2 }}>
              <span>{lead}</span>
              {accent && <span style={{ color: BRAND.accent }}>{accent}</span>}
            </div>
            <div style={{ display: "flex", marginTop: 28, fontSize: 30, color: BRAND.body }}>
              {profile.name} — {profile.role}
            </div>
          </div>

          <div style={{ display: "flex", fontFamily: "Plex Mono", fontSize: 20, letterSpacing: 4, color: BRAND.gold, textTransform: "uppercase" }}>
            {profile.focus}
          </div>
        </div>
      </div>
    ),
    {
      ...SOCIAL_SIZE,
      fonts: [
        { name: "Sora", data: sora, weight: 700, style: "normal" },
        { name: "Manrope", data: manrope, weight: 500, style: "normal" },
        { name: "Plex Mono", data: mono, weight: 500, style: "normal" },
      ],
    },
  );
}
