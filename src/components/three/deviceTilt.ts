/**
 * Phone tilt → camera parallax (the touch-device stand-in for mouse parallax).
 *
 * Android delivers `deviceorientation` events without asking. iOS requires an explicit
 * permission prompt (DeviceOrientationEvent.requestPermission), which would interrupt the
 * journey, so iOS keeps the gentle automatic drift instead.
 */
export const tilt = {
  /** True once real readings arrive. */
  active: false,
  /** Left/right tilt, −1 … 1. */
  x: 0,
  /** Forward/back tilt relative to how the phone was held at first, −1 … 1. */
  y: 0,
};

type OrientationEventClass = typeof DeviceOrientationEvent & { requestPermission?: () => Promise<string> };

/** Starts listening if the device supports it without a permission prompt. Returns a cleanup. */
export function startDeviceTilt(): () => void {
  if (typeof window === "undefined" || !("DeviceOrientationEvent" in window)) return () => {};
  if (!window.matchMedia("(pointer: coarse)").matches) return () => {};
  if (typeof (DeviceOrientationEvent as OrientationEventClass).requestPermission === "function") return () => {};

  let baseBeta: number | null = null;
  const clamp = (v: number) => Math.max(-1, Math.min(1, v));
  const onOrientation = (e: DeviceOrientationEvent) => {
    if (e.gamma === null || e.beta === null) return;
    // Use the first reading as "neutral", so however the phone is held feels centred.
    baseBeta ??= e.beta;
    tilt.x = clamp(e.gamma / 25);
    tilt.y = clamp((e.beta - baseBeta) / 25);
    tilt.active = true;
  };
  window.addEventListener("deviceorientation", onOrientation);
  return () => {
    window.removeEventListener("deviceorientation", onOrientation);
    tilt.active = false;
  };
}
