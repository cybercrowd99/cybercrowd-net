// capture/hostile_session/route-decider.ts
// Capture-Net: Hostile Session Route Decider Organ

interface RouteDecision {
  adversaryId: string;
  route: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  signals: string[];
  generatedAt: string;
}

interface RouteDecisionResult {
  adversaryId: string;
  decision: RouteDecision;
  timestamp: string;
}

interface MetaSignal {
  adversaryId: string;
  vector: string[];
  doctrine: string[];
  projected: string[];
  timestamp: string;
}

export class RouteDecider {
  constructor(
    private metaEmitter: {
      emit: (
        adversaryId: string
      ) => Promise<{ emitted: MetaSignal }>;
    }
  ) {}

  /**
   * Decide routing destination from emitted meta-signals.
   */
  async decide(adversaryId: string): Promise<RouteDecisionResult> {
    const { emitted } = await this.metaEmitter.emit(adversaryId);
    const timestamp = new Date().toISOString();

    const signals = Array.from(
      new Set([
        ...emitted.vector,
        ...emitted.doctrine,
        ...emitted.projected
      ])
    );

    const signalCount = signals.length;

    let route = "observation";
    let priority: RouteDecision["priority"] = "LOW";

    if (signalCount > 20) {
      route = "strategic_review";
      priority = "CRITICAL";
    } else if (signalCount > 10) {
      route = "active_analysis";
      priority = "HIGH";
    } else if (signalCount > 5) {
      route = "extended_monitoring";
      priority = "MEDIUM";
    }

    const decision: RouteDecision = {
      adversaryId,
      route,
      priority,
      signals,
      generatedAt: timestamp
    };

    return {
      adversaryId,
      decision,
      timestamp
    };
  }
}
