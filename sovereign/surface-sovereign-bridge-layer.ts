// sovereign/surface-sovereign-bridge-layer.ts

import { SovereignActionRouter } from "./sovereign-action-router";

export interface SurfaceBridgeEvent {
  id: string;
  epochIndex: number;
  surface: string;
  channel: string;
  intensity: number;
  payload: Record<string, any>;
  timestamp: string;
}

export class SurfaceSovereignBridgeLayer {
  private router = new SovereignActionRouter();
  private bridgeIndex = 0;

  private rand() {
    return Math.random();
  }

  private now() {
    return new Date().toISOString();
  }

  // Map sovereign routes to concrete surface endpoints
  private mapRouteToSurface(route: string): { surface: string; channel: string } {
    switch (route) {
      case "crown-signal":
        return { surface: "crown-signal-topology", channel: "crown-signal-stream" };
      case "doctrine":
        return { surface: "rules_regulations.html", channel: "doctrine-update" };
      case "capture-net":
        return { surface: "route-engine.html", channel: "capture-net-lane" };
      case "lineage":
        return { surface: "system-map.html", channel: "lineage-update" };
      case "civic-mesh":
      default:
        return { surface: "public-discourse.html", channel: "civic-stream" };
    }
  }

  // Optionally specialize certain surfaces by known files/topologies
  private specializeSurface(surface: string, payload: Record<string, any>): string {
    // Example: route high-force actions into operations dashboards
    const force = payload.action?.force ?? payload.force ?? 0;
    if (force > 0.7) {
      return "operations-dashboard-v2.html";
    }
    return surface;
  }

  bridge(): SurfaceBridgeEvent {
    const timestamp = this.now();

    const routed = this.router.route();

    const baseIntensity =
      this.rand() * 0.4 +
      routed.deliveryStrength * 0.6;

    const { surface: baseSurface, channel } = this.mapRouteToSurface(routed.route);
    const surface = this.specializeSurface(baseSurface, routed.payload);

    const payload = {
      routedId: routed.id,
      epochIndex: routed.epochIndex,
      route: routed.route,
      deliveryStrength: routed.deliveryStrength,
      surface,
      channel,
      action: routed.payload
    };

    const event: SurfaceBridgeEvent = {
      id: `surfaceBridgeEvent.${this.bridgeIndex}`,
      epochIndex: routed.epochIndex,
      surface,
      channel,
      intensity: baseIntensity,
      payload,
      timestamp
    };

    this.bridgeIndex += 1;

    return event;
  }
}
