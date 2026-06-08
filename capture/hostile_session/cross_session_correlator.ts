// capture/hostile_session/cross_session_correlator.ts
// Capture‑Net: Cross‑Session Correlator Organ

import { HostileSessionIntelligence } from "../types/hostile_session_intelligence.types";

interface CorrelationGroup {
  groupId: string;
  sessionIds: string[];
  sharedClusters: string[];
  sharedAnomalies: string[];
  sharedEntropyPatterns: string[];
  threatSignature: string[];
  generatedAt: string;
}

interface CorrelationResult {
  sessionId: string;
  correlatedGroups: CorrelationGroup[];
  timestamp: string;
}

export class CrossSessionCorrelator {
  constructor(private d1: D1Database) {}

  /**
   * Correlate one intelligence package against all other hostile intelligence entries.
   */
  async correlate(intel: HostileSessionIntelligence): Promise<CorrelationResult> {
    const sessionId = intel.sessionId;
    const timestamp = new Date().toISOString();

    const rows = await this.d1
      .prepare(
        `SELECT sessionId, archetypeTags, dominantSignals, supportingSignals
         FROM hostile_intelligence
         WHERE sessionId != ?`
      )
      .bind(sessionId)
      .all();

    const correlatedGroups: CorrelationGroup[] = [];

    for (const row of rows.results ?? []) {
      const otherTags = JSON.parse(row.archetypeTags ?? "[]");
      const otherSignals = JSON.parse(row.dominantSignals ?? "[]");

      const sharedClusters =
        intel.upstream?.behavioralClusters?.archetypeTags?.filter((t: string) =>
          otherTags.includes(t)
        ) ?? [];

      const sharedAnomalies = intel.factors.dominantSignals.filter((s: string) =>
        otherSignals.includes(s)
      );

      const sharedEntropyPatterns =
        intel.factors.supportingSignals.filter((s: string) =>
          (row.supportingSignals ?? "").includes(s)
        ) ?? [];

      if (
        sharedClusters.length ||
        sharedAnomalies.length ||
        sharedEntropyPatterns.length
      ) {
        correlatedGroups.push({
          groupId: crypto.randomUUID(),
          sessionIds: [sessionId, row.sessionId],
          sharedClusters,
          sharedAnomalies,
          sharedEntropyPatterns,
          threatSignature: [
            ...sharedClusters,
            ...sharedAnomalies,
            ...sharedEntropyPatterns
          ],
          generatedAt: timestamp
        });
      }
    }

    return {
      sessionId,
      correlatedGroups,
      timestamp
    };
  }
}
