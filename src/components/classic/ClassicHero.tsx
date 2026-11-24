import { Accented } from "@/components/ui/Accented";
import { ContactLinks } from "@/components/ui/ContactLinks";
import { Container } from "@/components/ui/Container";
import { Txt } from "@/components/ui/Txt";
import { metrics, profile } from "@/data/content";

/** "Facts in 10 seconds": who, what, now, results, stack — all above the fold on desktop. */
export function ClassicHero() {
  const facts: { term: string; detail: React.ReactNode }[] = [
    { term: "Now", detail: <Txt>{profile.currently}</Txt> },
    { term: "Focus", detail: profile.focus },
    {
      term: "Results",
      detail: (
        <ul className="space-y-1">
          {metrics.map((m) => (
            <li key={m.id}>
              {m.label}:{" "}
              {m.before && (
                <>
                  <span className="text-muted line-through decoration-muted/60">{m.before}</span> <span aria-hidden="true">→</span>
                  <span className="sr-only">now</span>{" "}
                </>
              )}
              <span className="font-mono text-gold">{m.after}</span>
            </li>
          ))}
        </ul>
      ),
    },
    { term: "Stack", detail: profile.stackHighlights.join(" · ") },
  ];

  return (
    <section aria-labelledby="classic-title" className="relative overflow-hidden pt-16 pb-20 md:pt-24 md:pb-28">
      <div aria-hidden="true" className="ambient-glow pointer-events-none absolute inset-x-0 -top-24 h-[640px]" />
      <Container className="relative grid gap-12 lg:grid-cols-12 lg:items-end">
        <div className="lg:col-span-7">
          <p className="label-mono text-gold">{profile.role}</p>
          <h1 id="classic-title" className="mt-5 text-display font-bold lg:text-[clamp(3rem,5.4vw,5.25rem)]">
            {profile.name}
          </h1>
          <p className="mt-6 max-w-[24ch] font-display text-subtitle font-bold text-heading">
            <Accented text={profile.headline} accent={profile.headlineAccent} />
          </p>
          <p className="mt-5 max-w-[56ch]">{profile.intro[0]}</p>
          <ContactLinks className="mt-9" />
        </div>

        <dl className="panel divide-y divide-border p-6 sm:p-8 lg:col-span-5">
          {facts.map((fact) => (
            <div key={fact.term} className="grid gap-1 py-4 first:pt-0 last:pb-0 sm:grid-cols-[6rem_1fr] sm:gap-4">
              <dt className="label-mono pt-1 text-muted">{fact.term}</dt>
              <dd className="text-heading">{fact.detail}</dd>
            </div>
          ))}
        </dl>
      </Container>
    </section>
  );
}
