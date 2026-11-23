"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { MathUtils, Vector3, type PointLight } from "three";
import { startDeviceTilt, tilt } from "@/components/three/deviceTilt";
import { frameAt, getCurves } from "@/components/three/path";
import { rig } from "@/components/three/rig";
import { useScene } from "@/components/three/SceneContext";
import { journeyStore } from "@/store/journey";

/** How quickly the camera catches up with the scroll position. Lower = more inertia. */
const FOLLOW = 3.2;
/** Pointer parallax strength (world units) on desktop. */
const PARALLAX = { x: 0.7, y: 0.35 };

/**
 * Drives the camera every frame:
 *   1. Smooth the scroll-derived path position (journeyStore.pathT) into rig.t → inertia.
 *   2. Place the camera on the camera curve and aim it at the target curve, both at rig.t.
 *   3. Add a gentle parallax: pointer on desktop, device tilt (Android) or a slow drift on phones.
 *   4. Lens-shift the view (setViewOffset) so the station sits beside the HTML panel.
 * Also moves two rim/fill lights with the camera, so every station is lit the same way
 * without changing the number of lights (which would recompile every shader).
 */
export function CameraRig() {
  const { camera, size } = useThree();
  const { palette } = useScene();
  const curves = useMemo(() => getCurves(), []);
  const rimRef = useRef<PointLight>(null);
  const fillRef = useRef<PointLight>(null);

  // Scratch objects, reused every frame (no allocations inside useFrame). Kept in a ref
  // because they are mutated after render.
  const scratchRef = useRef({ pos: new Vector3(), target: new Vector3(), parallax: new Vector3(), frame: [0, 0] as [number, number] });

  // Start at the current scroll position instead of flying in from the top on reload.
  useEffect(() => startDeviceTilt(), []);
  // Touch devices get device-tilt / auto-drift parallax instead of the pointer.
  const touch = useMemo(() => window.matchMedia("(pointer: coarse)").matches, []);

  useEffect(() => {
    rig.t = journeyStore.getState().pathT;
    return () => camera.clearViewOffset();
  }, [camera]);

  useFrame((state, rawDelta) => {
    const delta = Math.min(rawDelta, 0.1);
    const scratch = scratchRef.current;
    const { pathT } = journeyStore.getState();
    // Framing follows the layout (mobile stage band vs. desktop), not the screen width.
    const { stageMode } = journeyStore.getState();
    const mobile = touch || size.width < 768;
    const portrait = size.width < size.height;

    // 1. Inertia: exponential damping towards the scroll target, frame-rate independent.
    rig.t = MathUtils.damp(rig.t, pathT, FOLLOW, delta);

    // 2. Camera on its curve. In portrait the view is narrow, so pull the camera back a bit.
    curves.target.getPoint(rig.t, scratch.target);
    curves.camera.getPoint(rig.t, scratch.pos);
    if (portrait) {
      const pullBack = Math.min(1.6, (size.height / size.width) ** 0.6);
      scratch.pos.sub(scratch.target).multiplyScalar(pullBack).add(scratch.target);
    }

    // 3. Parallax (damped so it never feels twitchy).
    const time = state.clock.elapsedTime;
    //    Desktop: the pointer. Phones: device tilt where available (Android), otherwise a
    //    slow automatic drift so the scene never looks frozen.
    let px: number;
    let py: number;
    if (!mobile) {
      px = state.pointer.x * PARALLAX.x;
      py = state.pointer.y * PARALLAX.y;
    } else if (tilt.active) {
      px = tilt.x * 0.6;
      py = -tilt.y * 0.35;
    } else {
      px = Math.sin(time * 0.23) * 0.35;
      py = Math.cos(time * 0.19) * 0.2;
    }
    scratch.parallax.x = MathUtils.damp(scratch.parallax.x, px, 2.5, delta);
    scratch.parallax.y = MathUtils.damp(scratch.parallax.y, py, 2.5, delta);
    camera.position.copy(scratch.pos).add(scratch.parallax);
    camera.lookAt(scratch.target);

    // 4. Framing: shift the projection so the target lands at frame (NDC) on screen.
    //    offsetX < 0 moves objects right; offsetY > 0 moves them up (see three's
    //    PerspectiveCamera.updateProjectionMatrix).
    const [fx, fy] = frameAt(rig.t, stageMode, scratch.frame);
    camera.setViewOffset(size.width, size.height, (-fx * size.width) / 2, (fy * size.height) / 2, size.width, size.height);

    // Fog that follows the camera: the current station stays crisp, neighbouring stations
    // (≥ ~16 units further) fade into the plum background instead of cluttering the panels.
    const fog = state.scene.fog;
    if (fog && "near" in fog) {
      const distance = camera.position.distanceTo(scratch.target);
      fog.near = distance + 4;
      fog.far = distance + 20;
    }

    // Rim light behind the target, warm fill near the camera.
    rimRef.current?.position.set(scratch.target.x - 3, scratch.target.y + 4, scratch.target.z - 5);
    fillRef.current?.position.set(camera.position.x - 4, camera.position.y + 2, camera.position.z - 2);
  }, -1);

  return (
    <>
      <pointLight ref={rimRef} color={palette.color["accent-2"]} intensity={60} distance={26} decay={2} />
      <pointLight ref={fillRef} color={palette.color.gold} intensity={18} distance={22} decay={2} />
    </>
  );
}
