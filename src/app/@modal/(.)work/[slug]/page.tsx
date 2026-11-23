import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CaseStudy } from "@/components/ui/CaseStudy";
import { CaseStudyModal } from "@/components/ui/CaseStudyModal";
import { getProject, projects } from "@/data/content";

/**
 * Intercepted /work/[slug]: when a case study is opened by client-side navigation (a card on the
 * journey or Classic View), it renders here as an overlay instead of replacing the page.
 * A direct visit or refresh renders the full page at app/work/[slug] instead.
 *
 * Prerendered for every slug. As on the full page, `params` is only read inside <Suspense>
 * (keeps the App Shell URL-independent), and the overlay itself is cached so the cards'
 * `prefetch` links can load it before the click; the card → overlay morph then starts instantly.
 */
export function generateStaticParams() {
  return projects.map((project) => ({ slug: project.slug }));
}

export default function CaseStudyOverlay({ params }: { params: Promise<{ slug: string }> }) {
  return (
    // No fallback: the card stays put until the overlay is ready, then morphs into it.
    <Suspense fallback={null}>
      <OverlayForParams params={params} />
    </Suspense>
  );
}

async function OverlayForParams({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!getProject(slug)) notFound();
  return <CachedOverlay slug={slug} />;
}

async function CachedOverlay({ slug }: { slug: string }) {
  "use cache";
  const project = getProject(slug);
  if (!project) return null;
  return (
    // Keyed by slug: "Next case study" inside the overlay mounts a fresh dialog.
    <CaseStudyModal key={project.slug} slug={project.slug}>
      <CaseStudy project={project} variant="modal" />
    </CaseStudyModal>
  );
}
