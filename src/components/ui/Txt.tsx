/** Matches [placeholder: …], [confirm: …] and [FILL …] markers from content.ts. */
const MARKER = /(\[(?:placeholder|confirm|FILL)[^\]]*\])/g;

/**
 * Renders a content string and marks any unfinished markers (mono + dashed underline) so
 * they are impossible to miss before launch. Gold/amber is a theme colour now, so the
 * marker style uses no colour of its own.
 */
export function Txt({ children }: { children: string }) {
  // split() with a capture group puts the markers at odd indexes.
  const parts = children.split(MARKER);
  if (parts.length === 1) return children;

  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <mark
            key={i}
            className="bg-transparent font-mono text-[0.9em] text-heading underline decoration-heading/70 decoration-dashed decoration-1 underline-offset-[5px]"
          >
            {part}
          </mark>
        ) : (
          part
        ),
      )}
    </>
  );
}
