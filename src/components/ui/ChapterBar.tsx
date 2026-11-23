"use client";

import { ListIcon, XIcon } from "lucide-react";
import { useLenis } from "lenis/react";
import { useEffect, useRef } from "react";
import { railChapters, type ChapterId } from "@/data/content";
import { cn } from "@/lib/utils";
import { journeyStore } from "@/store/journey";

/**
 * Compact bottom bar (below xl): current chapter + scroll progress + a "Chapters" sheet.
 * The sheet is a native <dialog>: focus trap, Esc to close and inert background for free.
 */
export function ChapterBar({ activeId }: { activeId?: ChapterId }) {
  const progressRef = useRef<HTMLSpanElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  // Set when the sheet closes because a chapter link was chosen (focus goes to the chapter).
  const navigatingRef = useRef(false);
  const lenis = useLenis();
  const current = railChapters.find((chapter) => chapter.id === activeId);

  // Progress line: written straight to the DOM on every scroll frame, with no React re-render.
  useEffect(() => {
    const apply = (progress: number) => {
      if (progressRef.current) progressRef.current.style.transform = `scaleX(${progress})`;
    };
    apply(journeyStore.getState().progress);
    return journeyStore.subscribe((state) => apply(state.progress));
  }, []);

  function open() {
    lenis?.stop(); // Freeze the page behind the sheet.
    dialogRef.current?.showModal();
  }

  function onClose() {
    lenis?.start();
    if (!navigatingRef.current) triggerRef.current?.focus();
    navigatingRef.current = false;
  }

  function onChapterClick() {
    // Restart Lenis *before* the anchor handler runs: a stopped Lenis ignores scrollTo.
    navigatingRef.current = true;
    lenis?.start();
    dialogRef.current?.close();
  }

  return (
    <div data-bottom-bar className="fixed inset-x-3 bottom-3 z-30 xl:hidden">
      <div className="relative flex h-14 items-center justify-between gap-3 overflow-hidden rounded-full border border-border bg-surface/80 pr-1.5 pl-5 shadow-card backdrop-blur-xl">
        <p className="label-mono min-w-0 truncate">
          {current ? (
            <>
              <span className="text-gold">{current.number}</span> — <span className="text-heading">{current.name}</span>
            </>
          ) : (
            <span className="text-muted">Follow the data</span>
          )}
        </p>
        <button
          ref={triggerRef}
          type="button"
          onClick={open}
          aria-haspopup="dialog"
          className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full bg-surface-2 px-4 text-[0.875rem] font-medium text-heading"
        >
          Chapters
          <ListIcon aria-hidden="true" className="size-4" />
        </button>
        <span
          ref={progressRef}
          aria-hidden="true"
          className="bg-signature absolute bottom-0 left-0 h-0.5 w-full origin-left scale-x-0"
        />
      </div>

      <dialog
        ref={dialogRef}
        aria-labelledby="chapter-sheet-title"
        onClose={onClose}
        // Clicking the backdrop (the dialog element itself, outside the inner panel) closes it.
        onClick={(event) => event.target === event.currentTarget && dialogRef.current?.close()}
        className="fixed inset-x-3 top-auto bottom-3 m-0 max-h-[80svh] w-[calc(100vw-1.5rem)] max-w-none rounded-card border border-border bg-surface p-0 text-body shadow-card backdrop:bg-bg/70 backdrop:backdrop-blur-sm"
      >
        <div className="p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <h2 id="chapter-sheet-title" className="label-mono font-sans text-muted">
              Chapters
            </h2>
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              className="grid size-11 place-items-center rounded-full border border-border-strong text-heading"
            >
              <XIcon aria-hidden="true" className="size-5" />
              <span className="sr-only">Close chapters</span>
            </button>
          </div>
          <nav aria-label="Chapters" className="mt-3">
            <ol>
              {railChapters.map((chapter) => {
                const isActive = chapter.id === activeId;
                return (
                  <li key={chapter.id}>
                    <a
                      href={`#${chapter.id}`}
                      aria-current={isActive ? "location" : undefined}
                      onClick={onChapterClick}
                      className={cn(
                        "flex min-h-12 items-center gap-4 rounded-2xl px-3 font-display text-[1.125rem] font-bold transition-colors",
                        isActive ? "bg-surface-2 text-heading" : "text-body hover:text-heading",
                      )}
                    >
                      <span className="font-mono text-[0.8125rem] font-normal text-gold">{chapter.number}</span>
                      {chapter.name}
                    </a>
                  </li>
                );
              })}
            </ol>
          </nav>
        </div>
      </dialog>
    </div>
  );
}
