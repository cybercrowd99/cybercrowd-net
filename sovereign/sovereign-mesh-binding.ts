// sovereign/sovereign-mesh-binding.ts

import { CAPTURE_NET_SOVEREIGN_INTEGRATION } from "../capture-net/capture-net-sovereign-integration-manifest";

export interface MeshBindingRule {
  channelId: string;
  route: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  propagation: "LOCAL" | "REGIONAL" | "GLOBAL";
  governanceHook: string;
}

export const SOVEREIGN_MESH_BINDINGS: MeshBindingRule[] = CAPTURE_NET_SOVEREIGN_INTEGRATION.channels.map(
  (ch) => ({
    channelId: ch.id,
    route: `mesh.route.${ch.id.replace(/\./g, "_")}`,
    priority:
      ch.sourceLayer >= 28
        ? "CRITICAL"
        : ch.sourceLayer >= 25
        ? "HIGH"
        : ch.sourceLayer >= 22
        ? "MEDIUM"
        : "LOW",
    propagation:
      ch.sourceLayer >= 27
        ? "GLOBAL"
        : ch.sourceLayer >= 23
        ? "REGIONAL"
        : "LOCAL",
    governanceHook: `cdc.hook.${ch.id.replace(/\./g, "_")}`,
  })
);

export function getBindingForChannel(id: string): MeshBindingRule | undefined {
  return SOVEREIGN_MESH_BINDINGS.find((b) => b.channelId === id);
}
