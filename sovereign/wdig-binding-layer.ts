// sovereign/wdig-binding-layer.ts

import { CDC_INTEGRATION_CHANNELS } from "./cdc-integration-layer";
import { SOVEREIGN_MESH_BINDINGS } from "./sovereign-mesh-binding";

export interface WDIGBinding {
  id: string;
  spatialRoute: string;
  surfaces: ("MOBILE" | "DESKTOP" | "TABLET" | "WALL" | "MULTI_MONITOR")[];
  continuity: boolean;
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
}

export const WDIG_BINDINGS: WDIGBinding[] = CDC_INTEGRATION_CHANNELS.map((ch) => {
  const mesh = SOVEREIGN_MESH_BINDINGS.find((m) => m.channelId === ch.id.replace("cdc.capture.", ""));

  const surfaces =
    mesh?.priority === "CRITICAL"
      ? ["MOBILE", "DESKTOP", "TABLET", "WALL", "MULTI_MONITOR"]
      : mesh?.priority === "HIGH"
      ? ["MOBILE", "DESKTOP", "TABLET", "MULTI_MONITOR"]
      : mesh?.priority === "MEDIUM"
      ? ["MOBILE", "DESKTOP"]
      : ["MOBILE"];

  return {
    id: `wdig.bind.${ch.id}`,
    spatialRoute: `spatial.route.${ch.route.replace(/\./g, "_")}`,
    surfaces,
    continuity: mesh?.propagation === "GLOBAL",
    priority: mesh?.priority ?? "LOW",
  };
});

export function getWDIGBinding(id: string): WDIGBinding | undefined {
  return WDIG_BINDINGS.find((b) => b.id === id);
}
