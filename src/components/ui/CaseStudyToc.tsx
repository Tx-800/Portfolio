export interface TocItem {
  id: string;
  title: string;
}

/** Sticky "On this page" list (desktop only). Active-section highlighting arrives in Phase 5. */
export function CaseStudyToc({ items }: { items: TocItem[] }) {
  return (
    <nav aria-label="On this page" className="hidden lg:col-span-3 lg:block">
      <div className="sticky top-24">
        <p className="label-mono text-muted">On this page</p>
        <ol className="mt-5 space-y-1 border-l border-border">
          {items.map((item, i) => (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                className="-ml-px flex gap-3 border-l border-transparent py-1.5 pl-4 text-[0.9375rem] text-body transition-colors hover:border-accent hover:text-heading"
              >
                <span className="font-mono text-[0.8125rem] text-gold">{String(i + 1).padStart(2, "0")}</span>
                {item.title}
              </a>
            </li>
          ))}
        </ol>
      </div>
    </nav>
  );
}
