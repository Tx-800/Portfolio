import { ImageResponse } from "next/og";
import { BRAND, PACKET_GRADIENT } from "@/lib/brand";

// iOS home-screen icon (iOS doesn't use SVG favicons): the gradient packet on plum.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: BRAND.bg }}>
        <div
          style={{
            width: 92,
            height: 92,
            borderRadius: 999,
            background: PACKET_GRADIENT,
            boxShadow: `0 0 60px 10px ${BRAND.accent}88`,
          }}
        />
      </div>
    ),
    size,
  );
}
