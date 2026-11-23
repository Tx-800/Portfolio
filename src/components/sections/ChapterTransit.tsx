/**
 * Empty scroll distance between two chapters: the TRAVEL part of the journey, where only the
 * 3D scene is visible and the camera flies to the next station (see lib/scrollMap.ts).
 * Mobile stage: a shorter, scrubbed flight (half a screen).
 * Hidden with reduced motion or without WebGL (globals.css), so the page collapses into a
 * compact, classic-style layout.
 */
export function ChapterTransit() {
  return <div aria-hidden="true" data-transit className="h-[60svh] md:h-[80svh] motion-reduce:hidden stage:h-[50svh]" />;
}
