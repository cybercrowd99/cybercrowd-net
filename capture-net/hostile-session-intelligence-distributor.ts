// capture-net/hostile-session-intelligence-distributor.ts

import { HostileSessionIntelligencePackage } from "./hostile-session-intelligence.types";

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
      distributedAt: timestamp,
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
        "automationBus",
      ],
      timestamp,
    };
  }
}
