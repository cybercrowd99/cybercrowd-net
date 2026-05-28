// sovereign/spatial-continuity-engine.ts

import { WDIG_BINDINGS } from "./wdig-binding-layer";

export interface ContinuityState {
  bindingId: string;
  surface: string;
  timestamp: string;
  payload: any;
}

export interface ContinuityRule {
  id: string;
  allowHandoff: boolean;
  persistState: boolean;
  anchorSpatially: boolean;
  surfaces: string[];
}

export const CONTINUITY_RULES: ContinuityRule[] = [
  {
    id: "continuity.global",
    allowHandoff: true,
    persistState: true,
    anchorSpatially: true,
    surfaces: ["MOBILE", "DESKTOP", "TABLET", "WALL", "MULTI_MONITOR"]
  },
  {
    id: "continuity.regional",
    allowHandoff: true,
    persistState: true,
    anchorSpatially: false,
    surfaces: ["MOBILE", "DESKTOP", "TABLET"]
  },
  {
    id: "continuity.local",
    allowHandoff: false,
    persistState: true,
    anchorSpatially: false,
    surfaces: ["MOBILE"]
  }
];

export class SpatialContinuityEngine {
  private state: ContinuityState[] = [];

  constructor(private wdig: { getWDIGBinding: (id: string) => any }) {}

  propagate(bindingId: string, payload: any): ContinuityState[] {
    const binding = this.wdig.getWDIGBinding(bindingId);
    const timestamp = new Date().toISOString();

    const rule =
      binding.priority === "CRITICAL"
        ? CONTINUITY_RULES[0]
        : binding.priority === "HIGH"
        ? CONTINUITY_RULES[1]
        : CONTINUITY_RULES[2];

    const updates: ContinuityState[] = rule.surfaces.map((surface) => {
      const entry: ContinuityState = {
        bindingId,
        surface,
        timestamp,
        payload
      };
      this.state.push(entry);
      return entry;
    });

    return updates;
  }

  getStateForSurface(surface: string): ContinuityState[] {
    return this.state.filter((s) => s.surface === surface);
  }
}
