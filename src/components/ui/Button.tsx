import Link from "next/link";
import { Magnetic } from "@/components/ui/Magnetic";
import { cn, isExternal } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost";

interface ButtonLinkProps {
  href: string;
  children: React.ReactNode;
  variant?: Variant;
  icon?: React.ReactNode;
  className?: string;
  /** Opens in a new tab (external links). mailto: links never open a new tab. */
  newTab?: boolean;
  download?: boolean;
  /** next/link scroll behaviour; false keeps the page in place (case-study overlays). */
  scroll?: boolean;
  /** next/link per-link prefetch (resolves cached, URL-specific content before the click). */
  prefetch?: boolean;
}

const base =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 py-2.5 text-[0.9375rem] font-semibold transition-[box-shadow,border-color,color,filter,transform] duration-300 ease-out active:scale-[0.98]";

const variants: Record<Variant, string> = {
  primary: "bg-plasma text-bg shadow-glow hover:shadow-glow-strong hover:brightness-110",
  secondary: "border border-border-strong text-heading hover:border-accent/70",
  ghost: "text-body hover:text-heading",
};

/** Pill-shaped link styled as a button. Uses next/link for internal routes; primary CTAs are magnetic. */
export function ButtonLink({ href, children, variant = "primary", icon, className, newTab, download, scroll, prefetch }: ButtonLinkProps) {
  const classes = cn(base, variants[variant], className);
  const content = (
    <>
      {children}
      {icon && <span aria-hidden="true" className="[&>svg]:size-[18px]">{icon}</span>}
    </>
  );

  // Files (e.g. /resume.pdf) are plain links: next/link would try to prefetch them as routes.
  const isFile = /\.[a-z0-9]+$/i.test(href);
  let element: React.ReactNode;
  if (isExternal(href) || download || isFile) {
    const opensTab = newTab ?? href.startsWith("http");
    element = (
      <a
        href={href}
        className={classes}
        download={download || undefined}
        {...(opensTab ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      >
        {content}
        {opensTab && <span className="sr-only"> (opens in a new tab)</span>}
      </a>
    );
  } else {
    element = (
      <Link href={href} scroll={scroll} prefetch={prefetch} className={classes}>
        {content}
      </Link>
    );
  }

  return variant === "primary" ? <Magnetic>{element}</Magnetic> : element;
}
