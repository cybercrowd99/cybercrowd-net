// sovereign/civic-signal-layer.ts

import { WDIG_BINDINGS } from "./wdig-binding-layer";

export interface CivicSignal {
  id: string;
  class: "INFO" | "ADVISORY" | "ALERT" | "CRITICAL";
  summary: string;
  publicVectors: string[];
  timestamp: string;
}

export interface CivicRoute {
  id: string;
  surfaces: ("PUBLIC_DASHBOARD" | "COMMUNITY_FEED" | "CIVIC_TERMINAL")[];
  minClass: "INFO" | "ADVISORY" | "ALERT" | "CRITICAL";
}

export const CIVIC_ROUTES: CivicRoute[] = [
  {
    id: "civic.route.info",
    surfaces: ["PUBLIC_DASHBOARD"],
    minClass: "INFO"
  },
  {
    id: "civic.route.advisory",
    surfaces: ["PUBLIC_DASHBOARD", "COMMUNITY_FEED"],
    minClass: "ADVISORY"
  },
  {
    id: "civic.route.alert",
    surfaces: ["PUBLIC_DASHBOARD", "COMMUNITY_FEED", "CIVIC_TERMINAL"],
    minClass: "ALERT"
  },
  {
    id: "civic.route.critical",
    surfaces: ["CIVIC_TERMINAL"],
    minClass: "CRITICAL"
  }
];

export class CivicSignalLayer {
  constructor(private wdig: { getWDIGBinding: (id: string) => any }) {}

  emit(bindingId: string, summary: string, vectors: string[]): CivicSignal {
    const binding = this.wdig.getWDIGBinding(bindingId);
    const timestamp = new Date().toISOString();

    const classLevel: CivicSignal["class"] =
      vectors.length > 40
        ? "CRITICAL"
        : vectors.length > 20
        ? "ALERT"
        : vectors.length > 10
        ? "ADVISORY"
        : "INFO";

    return {
      id: `civic.signal.${bindingId}`,
      class: classLevel,
      summary,
      publicVectors: vectors.slice(0, 12),
      timestamp
    };
  }
}
