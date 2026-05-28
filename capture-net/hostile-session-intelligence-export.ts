// capture-net/hostile-session-intelligence-export.ts

import { HostileSessionIntelligencePackage } from "./hostile-session-intelligence.types";

interface ExportResult {
  sessionId: string;
  d1: boolean;
  kv: boolean;
  r2: boolean;
  timestamp: string;
}

export class HostileSessionIntelligenceExport {
  constructor(
    private d1: D1Database,
    private kv: KVNamespace,
    private r2: R2Bucket
  ) {}

  async export(pkg: HostileSessionIntelligencePackage): Promise<ExportResult> {
    const { intelligence, operatorView, machineView } = pkg;
    const sessionId = intelligence.sessionId;
    const timestamp = new Date().toISOString();

    const d1Record = {
      sessionId,
      threatScore: intelligence.threatScore,
      threatLevel: intelligence.threatLevel,
      hostility: intelligence.confidence.hostility,
      automationLikelihood: intelligence.confidence.automationLikelihood,
      lateralMovementIntent: intelligence.confidence.lateralMovementIntent,
      dataExfilIntent: intelligence.confidence.dataExfilIntent,
      persistenceIntent: intelligence.confidence.persistenceIntent,
      dominantSignals: JSON.stringify(intelligence.factors.dominantSignals),
      supportingSignals: JSON.stringify(intelligence.factors.supportingSignals),
      mitigatingSignals: JSON.stringify(intelligence.factors.mitigatingSignals),
      archetypeTags: JSON.stringify(
        intelligence.upstream?.behavioralClusters?.archetypeTags ?? []
      ),
      generatedAt: intelligence.generatedAt,
      exportedAt: timestamp,
    };

    await this.d1
      .prepare(
        `INSERT INTO hostile_intelligence
         (sessionId, threatScore, threatLevel, hostility, automationLikelihood,
          lateralMovementIntent, dataExfilIntent, persistenceIntent,
          dominantSignals, supportingSignals, mitigatingSignals, archetypeTags,
          generatedAt, exportedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        d1Record.sessionId,
        d1Record.threatScore,
        d1Record.threatLevel,
        d1Record.hostility,
        d1Record.automationLikelihood,
        d1Record.lateralMovementIntent,
        d1Record.dataExfilIntent,
        d1Record.persistenceIntent,
        d1Record.dominantSignals,
        d1Record.supportingSignals,
        d1Record.mitigatingSignals,
        d1Record.archetypeTags,
        d1Record.generatedAt,
        d1Record.exportedAt
      )
      .run();

    const kvRecord = {
      sessionId,
      threatLevel: intelligence.threatLevel,
      threatScore: intelligence.threatScore,
      tags: intelligence.upstream?.behavioralClusters?.archetypeTags ?? [],
      exportedAt: timestamp,
    };

    await this.kv.put(
      `hostile:intel:${sessionId}`,
      JSON.stringify(kvRecord),
      { expirationTtl: 60 * 60 * 24 * 30 }
    );

    const r2Key = `hostile/intel/${sessionId}.json`;
    await this.r2.put(r2Key, JSON.stringify(pkg), {
      httpMetadata: { contentType: "application/json" },
    });

    return {
      sessionId,
      d1: true,
      kv: true,
      r2: true,
      timestamp,
    };
  }
}
