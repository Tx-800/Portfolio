"use client";

import { ArrowDownIcon, XIcon } from "lucide-react";
import Link from "next/link";
import { useRef } from "react";
import { CHAPTERS, chapterStart, core, type ChapterKey } from "@/components/core/timeline";
import { coreText, getChapter, profile, railChapters } from "@/data/content";

/**
 * The fixed mobile UI over the stage (Oryzo-style): wordmark top-left, Menu pill top-right,
 * a tiny progress indicator bottom-left and "Scroll to continue" bottom-right.
 * CoreEngine updates the progress bar, scene counter and hint directly (no re-renders).
 * The menu is a native <dialog>: focus trap, Esc to close and the backdrop for free.
 */
export function CoreChrome() {
  const dialog = useRef<HTMLDialogElement>(null);

  const open = () => {
    core.menuOpen = true;
    dialog.current?.showModal();
  };
  const close = () => dialog.current?.close();

  const jump = (id: ChapterKey) => {
    close();
    // Land in the middle of the chapter's first hold.
    const stop = chapterStart(id);
    const y = window.__core?.scrollFor((stop.t0 + stop.t1) / 2);
    if (y !== undefined) window.scrollTo({ top: y, behavior: "instant" });
  };

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-50 hidden h-svh stage:block">
      <div className="pointer-events-auto absolute inset-x-4 top-3 flex items-center justify-between">
        <Link href="/" className="rounded-md font-display text-[1.375rem] font-bold tracking-[-0.03em] text-heading">
          yogesh<span className="text-accent">*</span>
          <span className="sr-only">{`${profile.name}, home`}</span>
        </Link>
        <button
          type="button"
          onClick={open}
          aria-haspopup="dialog"
          className="inline-flex min-h-11 items-center gap-2 rounded-full border border-heading/25 bg-bg/40 px-4 font-mono text-[0.75rem] font-medium tracking-[0.12em] text-heading uppercase backdrop-blur-md"
        >
          <span aria-hidden="true" className="size-1.5 rounded-full bg-heading" />
          {coreText.menu}
        </button>
      </div>

      {/* Progress: scene counter + a thin bar (engine-driven). */}
      <div aria-hidden="true" className="absolute bottom-5 left-4 flex items-center gap-2.5 font-mono text-[0.75rem] text-heading/80">
        <span data-core-count>01</span>
        <span className="relative h-px w-12 overflow-hidden bg-heading/20">
          <span data-core-bar className="absolute inset-0 origin-left scale-x-0 bg-heading" />
        </span>
        <span className="text-muted">{String(railChapters.length).padStart(2, "0")}</span>
      </div>

      <p data-core-hint aria-hidden="true" className="absolute right-4 bottom-4 flex items-center gap-2.5 font-mono text-[0.6875rem] font-medium tracking-[0.12em] text-heading uppercase">
        {coreText.scrollHint}
        <span className="grid size-7 place-items-center rounded-full border border-heading/40">
          <ArrowDownIcon className="size-3.5" />
        </span>
      </p>

      <dialog
        ref={dialog}
        aria-label={coreText.menuTitle}
        onClose={() => {
          core.menuOpen = false;
        }}
        className="pointer-events-auto m-0 h-svh max-h-none w-full max-w-none bg-bg/85 p-0 text-body backdrop-blur-xl backdrop:bg-transparent"
      >
        <div className="flex h-full flex-col px-4 pt-3 pb-8">
          <div className="flex items-center justify-between">
            <p className="label-mono text-muted">{coreText.menuTitle}</p>
            <button
              type="button"
              onClick={close}
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-heading/25 px-4 font-mono text-[0.75rem] tracking-[0.12em] text-heading uppercase"
            >
              <XIcon aria-hidden="true" className="size-4" />
              {coreText.closeMenu}
            </button>
          </div>

          <ol className="mt-6 flex min-h-0 flex-col overflow-y-auto">
            {CHAPTERS.map((id) => {
              const chapter = getChapter(id);
              return (
                <li key={id}>
                  <button
                    type="button"
                    onClick={() => jump(id)}
                    className="flex min-h-12 w-full items-baseline gap-4 text-left font-display text-[1.5rem] font-semibold tracking-[-0.02em] text-heading"
                  >
                    <span className="font-mono text-[0.8125rem] font-normal text-accent">{chapter.number}</span>
                    {chapter.name}
                  </button>
                </li>
              );
            })}
          </ol>

          <div className="mt-auto flex flex-wrap gap-3 pt-6">
            <Link href="/" className="inline-flex min-h-11 items-center rounded-full bg-heading px-5 text-[0.9375rem] font-semibold text-bg">
              {coreText.fullJourney}
            </Link>
            <Link href="/classic" className="inline-flex min-h-11 items-center rounded-full border border-border-strong px-5 text-[0.9375rem] text-heading">
              {coreText.classicView}
            </Link>
          </div>
        </div>
      </dialog>
    </div>
  );
}
