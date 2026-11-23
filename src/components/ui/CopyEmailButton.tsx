"use client";

import { CheckIcon, CopyIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function CopyEmailButton({ email, className }: { email: string; className?: string }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const id = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(id);
  }, [copied]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
    } catch {
      // Clipboard can be blocked (insecure context / permissions); the mailto link still works.
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className={cn(
        "inline-flex size-11 items-center justify-center rounded-full border border-border-strong text-body transition-colors duration-300 hover:border-accent/70 hover:text-heading",
        className,
      )}
    >
      {copied ? <CheckIcon aria-hidden="true" className="size-[18px] text-gold" /> : <CopyIcon aria-hidden="true" className="size-[18px]" />}
      <span className="sr-only">Copy email address</span>
      <span role="status" aria-live="polite" className="sr-only">
        {copied ? "Email address copied" : ""}
      </span>
    </button>
  );
}
