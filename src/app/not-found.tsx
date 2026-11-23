import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { notFoundText } from "@/data/content";

/**
 * 404 — the data packet, lost on an empty grid. Pure HTML/CSS (no WebGL), so it's instant and
 * works everywhere: a perspective floor drifts towards the viewer while the packet wanders and
 * pings, looking for its pipeline. All motion stops with reduced motion.
 */
export default function NotFound() {
  return (
    <section className="relative isolate flex min-h-[calc(100svh-4rem)] items-center overflow-hidden py-24">
      {/* Empty grid floor, fading into the dark. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-[62%] [perspective:640px]">
        <div
          className="absolute -inset-x-1/2 inset-y-0 origin-bottom animate-grid-flow motion-reduce:animate-none [transform:rotateX(62deg)] [background-size:64px_64px] [mask-image:linear-gradient(to_top,black_10%,transparent_85%)]"
          style={{
            backgroundImage:
              "linear-gradient(to right, var(--color-border-strong) 1px, transparent 1px), linear-gradient(to bottom, var(--color-border-strong) 1px, transparent 1px)",
          }}
        />
      </div>
      <div aria-hidden="true" className="ambient-glow pointer-events-none absolute inset-0 -z-10 opacity-70" />

      {/* The lost packet. */}
      <div aria-hidden="true" className="pointer-events-none absolute top-[20%] left-1/2 -translate-x-1/2 -translate-y-1/2 sm:top-[22%]">
        <div className="relative animate-wander motion-reduce:animate-none">
          <span className="absolute inset-0 animate-ping-out rounded-full border border-gold/70 motion-reduce:hidden" />
          <span className="absolute inset-0 animate-ping-out rounded-full border border-accent-2/60 [animation-delay:1.4s] motion-reduce:hidden" />
          <span className="block size-16 rounded-full bg-[radial-gradient(circle_at_34%_30%,var(--color-gold),var(--color-accent)_45%,var(--color-accent-2)_88%)] shadow-glow-strong sm:size-20" />
        </div>
      </div>

      <Container className="relative z-10 pt-24 sm:pt-28">
        <div className="mx-auto max-w-xl text-center">
          <p className="label-mono text-gold">{notFoundText.label}</p>
          <h1 className="mt-5 text-title font-bold">{notFoundText.heading}</h1>
          <p className="mx-auto mt-5 max-w-[46ch]">{notFoundText.body}</p>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <ButtonLink href="/">{notFoundText.home}</ButtonLink>
            <ButtonLink href="/classic" variant="secondary">
              {notFoundText.classic}
            </ButtonLink>
          </div>
        </div>
      </Container>
    </section>
  );
}
