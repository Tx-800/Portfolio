"use client";

import { useMemo, type Ref } from "react";
import type { Group } from "three";
import { STATIONS } from "@/components/three/path";
import type { ChapterId } from "@/data/content";

interface StationProps {
  id: ChapterId;
  ref?: Ref<Group>;
  children: React.ReactNode;
}

/**
 * Places a station at its world position and turns it to face its camera, so every station
 * can be modelled in simple local space: +z points at the viewer, +y is up.
 * To swap a procedural station for a .glb later, render the model inside <Station>.
 */
export function Station({ id, ref, children }: StationProps) {
  const def = STATIONS[id];
  // Yaw only (keeps the station upright): turn towards the camera's x/z offset.
  const yaw = useMemo(() => Math.atan2(def.camera[0], def.camera[2]), [def]);

  return (
    <group ref={ref} position={[...def.position]} rotation={[0, yaw, 0]}>
      {children}
    </group>
  );
}
