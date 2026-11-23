import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CaseStudy } from "@/components/ui/CaseStudy";
import { CaseStudySkeleton } from "@/components/ui/CaseStudySkeleton";
import { getProject, projects } from "@/data/content";

// Every case study is prerendered at build time. (`dynamicParams` isn't available with
// cacheComponents, so unknown slugs fall through to notFound() below.)
export function generateStaticParams() {
  return projects.map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({ params }: PageProps<"/work/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) return {};

  return {
    title: project.title,
    description: project.summary,
    alternates: { canonical: `/work/${project.slug}` },
    openGraph: { title: project.title, description: project.summary, url: `/work/${project.slug}` },
  };
}

/**
 * Cache Components + Partial Prefetching: the page itself must not read `params`, so its
 * App Shell is the same for every slug and navigations stay instant. The slug is read inside
 * <Suspense>; the slug-specific part is cached ("use cache") so links with `prefetch` can
 * resolve it before the click. Direct visits still get fully prerendered HTML per slug.
 */
export default function WorkPage({ params }: PageProps<"/work/[slug]">) {
  return (
    <Suspense fallback={<CaseStudySkeleton />}>
      <CaseStudyForParams params={params} />
    </Suspense>
  );
}

async function CaseStudyForParams({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!getProject(slug)) notFound();
  return <CachedCaseStudy slug={slug} />;
}

async function CachedCaseStudy({ slug }: { slug: string }) {
  "use cache";
  const project = getProject(slug);
  return project ? <CaseStudy project={project} /> : null;
}
