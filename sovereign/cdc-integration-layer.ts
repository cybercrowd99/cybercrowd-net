// sovereign/cdc-integration-layer.ts

import { SOVEREIGN_MESH_BINDINGS } from "./sovereign-mesh-binding";
import { CAPTURE_NET_SOVEREIGN_INTEGRATION } from "../capture-net/capture-net-sovereign-integration-manifest";

export interface CDCChannel {
  id: string;
  route: string;
  description: string;
  readOnly: boolean;
  governanceLevel: "OPERATOR" | "DIRECTOR" | "SOVEREIGN";
}

export const CDC_INTEGRATION_CHANNELS: CDCChannel[] =
  CAPTURE_NET_SOVEREIGN_INTEGRATION.channels.map((ch) => {
    const binding = SOVEREIGN_MESH_BINDINGS.find((b) => b.channelId === ch.id);

    return {
      id: `cdc.capture.${ch.id}`,
      route: binding?.route ?? `mesh.route.${ch.id}`,
      description: ch.description,
      readOnly: ch.sourceLayer < 26,
      governanceLevel:
        ch.sourceLayer >= 28
          ? "SOVEREIGN"
          : ch.sourceLayer >= 25
          ? "DIRECTOR"
          : "OPERATOR",
    };
  });

export function getCDCChannel(id: string): CDCChannel | undefined {
  return CDC_INTEGRATION_CHANNELS.find((c) => c.id === id);
}
