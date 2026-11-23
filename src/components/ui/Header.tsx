"use client";

import { LayoutListIcon, OrbitIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { profile } from "@/data/content";

export function Header() {
  const pathname = usePathname();
  const isClassic = pathname === "/classic";
  // Each page has a #contact section except case studies, which link back to the journey's.
  const contactHref = pathname.startsWith("/work/") ? "/#contact" : "#contact";

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-bg/70 backdrop-blur-md">
      <Container className="flex h-16 items-center justify-between gap-4">
        <Link href="/" className="rounded-md font-display text-[1.375rem] font-bold tracking-[-0.03em] text-heading">
          yogesh<span className="text-accent">*</span>
          <span className="sr-only">{`${profile.name}, home`}</span>
        </Link>

        <nav aria-label="Primary" className="flex items-center gap-2">
          <Link
            href={isClassic ? "/" : "/classic"}
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border-strong px-4 text-[0.875rem] text-heading transition-colors duration-300 hover:border-accent/70"
          >
            {isClassic ? <OrbitIcon aria-hidden="true" className="size-4" /> : <LayoutListIcon aria-hidden="true" className="size-4" />}
            <span className="hidden min-[400px]:inline">{isClassic ? "Immersive view" : "Classic view"}</span>
            <span className="min-[400px]:hidden">{isClassic ? "Immersive" : "Classic"}</span>
          </Link>
          <a
            href={contactHref}
            className="inline-flex min-h-11 items-center rounded-full bg-heading px-4 text-[0.875rem] font-semibold text-bg transition-shadow duration-300 hover:shadow-glow"
          >
            Let’s talk
          </a>
        </nav>
      </Container>
    </header>
  );
}
