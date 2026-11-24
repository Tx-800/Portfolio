"use client";

import { ArrowDownIcon, ArrowRightIcon } from "lucide-react";
import { useEffect, useRef, type FormEvent } from "react";
import { boot } from "@/data/content";
import { cn } from "@/lib/utils";

interface TerminalProps {
  /** Lines typed so far (the last one may be partial). */
  lines: string[];
  /** Command output, appended below the boot lines. */
  history: string[];
  /** Typing finished: show the prompt and the buttons. */
  ready: boolean;
  /** Focus the input once ready (desktop); on touch the Start button gets focus instead. */
  focusInput: boolean;
  onCommand: (command: string) => void;
  onStart: () => void;
  /** "Skip to projects": closes the terminal and jumps to the first projects chapter. */
  onSkip: () => void;
}

/** The boot terminal UI: typed lines, blinking caret, a live prompt and the two exits. */
export function Terminal({ lines, history, ready, focusInput, onCommand, onStart, onSkip }: TerminalProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const startRef = useRef<HTMLButtonElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ready) return;
    if (focusInput) inputRef.current?.focus({ preventScroll: true });
    else startRef.current?.focus({ preventScroll: true });
  }, [ready, focusInput]);

  // Keep the newest output in view. (Braces matter: newer browsers return a Promise from
  // scrollIntoView, and an effect must return nothing or a cleanup function.)
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "nearest" });
  }, [history.length]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const input = inputRef.current;
    if (!input) return;
    onCommand(input.value);
    input.value = "";
  }

  return (
    <div className="panel w-full max-w-2xl overflow-hidden p-0 shadow-card">
      <div className="flex items-center gap-2 border-b border-border px-5 py-3">
        <span aria-hidden="true" className="size-2.5 rounded-full bg-accent-2/80" />
        <span aria-hidden="true" className="size-2.5 rounded-full bg-accent/80" />
        <span aria-hidden="true" className="size-2.5 rounded-full bg-gold/80" />
        <h2 id="boot-title" className="label-mono ml-3 font-sans text-muted">
          {boot.messages.title}
        </h2>
      </div>

      <div className="max-h-[50svh] space-y-2 overflow-y-auto p-6 font-mono text-[0.9375rem] text-body sm:p-8" data-lenis-prevent>
        {lines.map((line, i) => (
          <p key={i} className={cn(i === lines.length - 1 && !ready && "text-heading")}>
            {line}
            {/* Caret rides on the line being typed. */}
            {i === lines.length - 1 && !ready && <Caret />}
          </p>
        ))}
        {ready && (
          <>
            <p className="text-heading">{boot.messages.ready}</p>
            {history.map((line, i) => (
              <p key={i} className={line.startsWith(">") ? "text-heading" : "text-gold"}>
                {line}
              </p>
            ))}
            <form onSubmit={submit} className="flex items-center gap-2 text-heading">
              <span aria-hidden="true">&gt;</span>
              <label htmlFor="boot-input" className="sr-only">
                {boot.messages.inputLabel}
              </label>
              <input
                ref={inputRef}
                id="boot-input"
                autoComplete="off"
                autoCapitalize="off"
                spellCheck={false}
                enterKeyHint="go"
                className="min-w-0 flex-1 bg-transparent caret-accent outline-none"
              />
            </form>
          </>
        )}
        <div ref={bottomRef} />
      </div>

      <div
        className={cn(
          "flex flex-wrap gap-3 border-t border-border p-6 transition-opacity duration-500 sm:px-8",
          ready ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      >
        <button
          ref={startRef}
          type="button"
          onClick={onStart}
          className="inline-flex min-h-11 items-center gap-2 rounded-full bg-plasma px-5 text-[0.9375rem] font-semibold text-bg shadow-glow transition-[box-shadow,filter] duration-300 hover:shadow-glow-strong hover:brightness-110"
        >
          {boot.startLabel}
          <ArrowDownIcon aria-hidden="true" className="size-[18px]" />
        </button>
        <button
          type="button"
          onClick={onSkip}
          className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border-strong px-5 text-[0.9375rem] font-semibold text-heading transition-colors hover:border-accent/70"
        >
          {boot.skipLabel}
          <ArrowRightIcon aria-hidden="true" className="size-[18px]" />
        </button>
      </div>
    </div>
  );
}

function Caret() {
  return <span aria-hidden="true" className="ml-0.5 inline-block h-[1.1em] w-2 translate-y-[0.2em] animate-caret bg-accent" />;
}
