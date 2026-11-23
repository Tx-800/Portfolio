import { railChapters, type ChapterId } from "@/data/content";
import { cn } from "@/lib/utils";

/** Desktop rail (xl+): every chapter by name, the current one highlighted. */
export function ChapterRail({ activeId }: { activeId?: ChapterId }) {
  return (
    <nav aria-label="Chapters" className="fixed top-1/2 right-0 z-30 hidden -translate-y-1/2 xl:block">
      {/* Soft fade from the right edge keeps the labels readable over bright 3D objects. */}
      <ol className="flex flex-col items-end bg-[radial-gradient(ellipse_at_right,var(--color-bg)_35%,transparent_72%)] py-10 pr-6 pl-16">
        {railChapters.map((chapter) => {
          const isActive = chapter.id === activeId;
          return (
            <li key={chapter.id}>
              <a
                href={`#${chapter.id}`}
                aria-current={isActive ? "location" : undefined}
                className="group flex min-h-9 items-center justify-end gap-3 rounded-md pl-2"
              >
                <span
                  className={cn(
                    "label-mono text-[0.6875rem] transition-colors duration-300",
                    isActive ? "text-heading" : "text-muted group-hover:text-heading",
                  )}
                >
                  <span className={isActive ? "text-gold" : undefined}>{chapter.number}</span> {chapter.name}
                </span>
                <span
                  aria-hidden="true"
                  className={cn(
                    "block h-0.5 rounded-full transition-[width,background-color] duration-500 ease-out",
                    isActive ? "bg-signature w-8" : "w-4 bg-border-strong group-hover:w-6",
                  )}
                />
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
