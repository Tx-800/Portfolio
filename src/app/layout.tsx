import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, Manrope, Sora } from "next/font/google";
import { Cursor } from "@/components/ui/Cursor";
import { Footer } from "@/components/ui/Footer";
import { Header } from "@/components/ui/Header";
import { Providers } from "@/components/ui/Providers";
import { profile } from "@/data/content";
import { SITE_DESCRIPTION, SITE_TITLE, SITE_URL, THEME_COLOR } from "@/lib/site";
import "./globals.css";

const display = Sora({ subsets: ["latin"], weight: ["400", "600", "700"], variable: "--font-sora", display: "swap" });
const sans = Manrope({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-manrope", display: "swap" });
const mono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-plex-mono", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: SITE_TITLE, template: `%s · ${profile.name}` },
  description: SITE_DESCRIPTION,
  authors: [{ name: profile.name }],
  openGraph: {
    type: "website",
    siteName: profile.name,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: "/",
  },
  twitter: { card: "summary_large_image", title: SITE_TITLE, description: SITE_DESCRIPTION },
};

export const viewport: Viewport = {
  themeColor: THEME_COLOR,
  colorScheme: "dark",
};

/**
 * `modal` is the @modal parallel-route slot: case studies opened from a card render there as an
 * overlay (app/@modal/(.)work/[slug]) while the page underneath stays mounted.
 */
export default function RootLayout({
  children,
  modal,
}: Readonly<{ children: React.ReactNode; modal: React.ReactNode }>) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable} ${mono.variable}`}>
      <body>
        {/* MotionConfig only: renders no DOM, so header/main/footer stay direct children of <body>. */}
        <Providers>
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-full focus:bg-heading focus:px-5 focus:py-3 focus:text-bg"
          >
            Skip to content
          </a>
          <Header />
          <main id="main">{children}</main>
          <Footer />
          {modal}
          <Cursor />
        </Providers>
      </body>
    </html>
  );
}
