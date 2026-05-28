// civic/public-mesh-router.ts

import { CivicSignal } from "../sovereign/civic-signal-layer";
import { CIVIC_ROUTES } from "./civic-transparency-dashboard";

export interface MeshRouteResult {
  routeId: string;
  surfaces: string[];
  signal: CivicSignal;
  timestamp: string;
}

export class PublicMeshRouter {
  constructor(private routes = CIVIC_ROUTES) {}

  route(signal: CivicSignal): MeshRouteResult[] {
    const timestamp = new Date().toISOString();

    const eligible = this.routes.filter((r) => {
      const order = ["INFO", "ADVISORY", "ALERT", "CRITICAL"];
      return order.indexOf(signal.class) >= order.indexOf(r.minClass);
    });

    return eligible.map((r) => ({
      routeId: r.id,
      surfaces: r.surfaces,
      signal,
      timestamp
    }));
  }
}
