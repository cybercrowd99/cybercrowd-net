// capture/hostile_session/intelligence_distributor.ts
// Capture‑Net: Hostile Session Intelligence Distributor Organ

import { HostileSessionIntelligencePackage } from "../types/hostile_session_intelligence.types";

interface DistributionResult {
  sessionId: string;
  distributedTo: string[];
  timestamp: string;
}

export class HostileSessionIntelligenceDistributor {
  constructor(
    private correlationBus: Queue,
    private threatIndexBus: Queue,
    private operatorDashboardBus: Queue,
    private automationBus: Queue
  ) {}

  /**
   * Normalize and distribute hostile-session intelligence to all downstream buses.
   */
  async distribute(pkg: HostileSessionIntelligencePackage): Promise<DistributionResult> {
    const { intelligence } = pkg;
    const sessionId = intelligence.sessionId;
    const timestamp = new Date().toISOString();

    const normalized = {
      sessionId,
      threatScore: intelligence.threatScore,
      threatLevel: intelligence.threatLevel,
      confidence: intelligence.confidence,
      factors: intelligence.factors,
      archetypeTags: intelligence.upstream?.behavioralClusters?.archetypeTags ?? [],
      generatedAt: intelligence.generatedAt,
      distributedAt: timestamp
    };

    await this.correlationBus.send(normalized);
    await this.threatIndexBus.send(normalized);
    await this.operatorDashboardBus.send(normalized);
    await this.automationBus.send(normalized);

    return {
      sessionId,
      distributedTo: [
        "correlationBus",
        "threatIndexBus",
        "operatorDashboardBus",
        "automationBus"
      ],
      timestamp
    };
  }
}
