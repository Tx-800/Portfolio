import { Container } from "@/components/ui/Container";

/**
 * Placeholder shown for a split second while a case study streams in after a client-side
 * navigation that wasn't prefetched yet. Shapes mirror CaseStudyHeader so nothing jumps.
 */
export function CaseStudySkeleton() {
  return (
    <div aria-hidden="true" className="animate-pulse pt-10 pb-16 motion-reduce:animate-none md:pt-14">
      <Container>
        <div className="h-7 w-40 rounded-full bg-surface-2" />
        <div className="mt-8 h-[clamp(2.5rem,7.2vw,6rem)] w-3/4 max-w-2xl rounded-2xl bg-surface-2" />
        <div className="mt-6 h-8 w-1/2 max-w-md rounded-xl bg-surface-2" />
        <div className="mt-9 h-11 w-40 rounded-full bg-surface-2" />
      </Container>
    </div>
  );
}
