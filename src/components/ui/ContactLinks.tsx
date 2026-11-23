import { FileTextIcon, MailIcon } from "lucide-react";
import { GithubIcon, LinkedinIcon } from "@/components/ui/BrandIcons";
import { ButtonLink } from "@/components/ui/Button";
import { CopyEmailButton } from "@/components/ui/CopyEmailButton";
import { Txt } from "@/components/ui/Txt";
import { contact } from "@/data/content";
import { cn } from "@/lib/utils";

/** Email (primary + copy), GitHub, LinkedIn, résumé. Missing URLs render as placeholders. */
export function ContactLinks({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-wrap items-center gap-3", className)}>
      <ButtonLink href={`mailto:${contact.email}`} icon={<MailIcon />}>
        {contact.email}
      </ButtonLink>
      <CopyEmailButton email={contact.email} />

      {contact.github ? (
        <ButtonLink href={contact.github} variant="secondary" icon={<GithubIcon />}>
          GitHub
        </ButtonLink>
      ) : (
        <Placeholder label="GitHub URL" />
      )}

      {contact.linkedin ? (
        <ButtonLink href={contact.linkedin} variant="secondary" icon={<LinkedinIcon />}>
          LinkedIn
        </ButtonLink>
      ) : (
        <Placeholder label="LinkedIn URL" />
      )}

      <ButtonLink href={contact.resume} variant="secondary" icon={<FileTextIcon />} newTab>
        Résumé
      </ButtonLink>
    </div>
  );
}

function Placeholder({ label }: { label: string }) {
  return (
    <span className="inline-flex min-h-11 items-center rounded-full border border-dashed border-border-strong px-4 text-[0.9375rem]">
      <Txt>{`[placeholder: ${label}]`}</Txt>
    </span>
  );
}
