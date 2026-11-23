import { cn } from "@/lib/utils";

interface AccentedProps {
  text: string;
  accent?: string;
  /** Extra classes for the accent span, e.g. whitespace-nowrap to keep it on one line. */
  accentClassName?: string;
}

/**
 * Renders `text`, painting the first occurrence of `accent` with the signature gradient.
 * Used for headline accent words ("I connect apps, data and AI agents.").
 */
export function Accented({ text, accent, accentClassName }: AccentedProps) {
  const index = accent ? text.indexOf(accent) : -1;
  if (!accent || index === -1) return text;

  return (
    <>
      {text.slice(0, index)}
      <span className={cn("text-signature", accentClassName)}>{accent}</span>
      {text.slice(index + accent.length)}
    </>
  );
}
