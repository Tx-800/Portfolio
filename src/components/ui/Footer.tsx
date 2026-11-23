import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { footer } from "@/data/content";

export function Footer() {
  return (
    <footer className="border-t border-border/60 py-10">
      <Container className="flex flex-col gap-4 text-[0.9375rem] text-muted sm:flex-row sm:items-center sm:justify-between">
        <p>{footer.note}</p>
        <nav aria-label="Footer" className="flex gap-6">
          <Link href="/" className="link-underline hover:text-heading">
            Immersive view
          </Link>
          <Link href="/classic" className="link-underline hover:text-heading">
            Classic view
          </Link>
        </nav>
      </Container>
    </footer>
  );
}
