let supported: boolean | undefined;

/** True if the browser can create a WebGL context. Cached after the first check. */
export function hasWebGL(): boolean {
  if (supported !== undefined) return supported;
  try {
    const canvas = document.createElement("canvas");
    supported = Boolean(canvas.getContext("webgl2") ?? canvas.getContext("webgl"));
  } catch {
    supported = false;
  }
  return supported;
}
