// capture-net/hostile-session-long-range-pattern-engine.ts

import { HostileSessionIntelligence } from "./hostile-session-intelligence.types";

interface LongRangePattern {
  adversaryId: string;
  epochs: {
    epochId: string;
    sessionIds: string[];
    dominantSignals: string[];
    entropyDrift: number;
    escalationCycle: string[];
    timestampRange: { start: string; end: string };
  }[];
  longRangeThreatVector: string[];
  generatedAt: string;
}

interface PatternResult {
  adversaryId: string;
  pattern: LongRangePattern;
  timestamp: string;
}

export class HostileSessionLongRangePatternEngine {
  constructor(private profiler: any, private d1: D1Database) {}

  async analyze(adversaryId: string): Promise<PatternResult> {
    const timestamp = new Date().toISOString();

    const rows = await this.d1
      .prepare(
        `SELECT sessionId, dominantSignals, supportingSignals, generatedAt
         FROM hostile_intelligence
         WHERE sessionId IN (
           SELECT sessionId FROM adversary_sessions WHERE adversaryId = ?
         )
         ORDER BY generatedAt ASC`
      )
      .bind(adversaryId)
      .all();

    const epochs: LongRangePattern["epochs"] = [];
    let currentEpoch: any = null;

    for (const row of rows.results ?? []) {
      const signals = JSON.parse(row.dominantSignals ?? "[]");
      const time = new Date(row.generatedAt).getTime();

      if (!currentEpoch) {
        currentEpoch = {
          epochId: crypto.randomUUID(),
          sessionIds: [row.sessionId],
          dominantSignals: [...signals],
          entropyDrift: 0,
          escalationCycle: [...signals],
          timestampRange: { start: row.generatedAt, end: row.generatedAt },
          lastTime: time,
        };
        continue;
      }

      const drift = Math.abs(time - currentEpoch.lastTime);
      currentEpoch.entropyDrift += drift;
      currentEpoch.sessionIds.push(row.sessionId);
      currentEpoch.dominantSignals.push(...signals);
      currentEpoch.escalationCycle.push(...signals);
      currentEpoch.timestampRange.end = row.generatedAt;
      currentEpoch.lastTime = time;

      if (drift > 1000 * 60 * 60 * 6) {
        delete currentEpoch.lastTime;
        epochs.push(currentEpoch);
        currentEpoch = null;
      }
    }

    if (currentEpoch) {
      delete currentEpoch.lastTime;
      epochs.push(currentEpoch);
    }

    const longRangeThreatVector = Array.from(
      new Set(
        epochs.flatMap((e) => [
          ...e.dominantSignals,
          ...e.escalationCycle,
        ])
      )
    );

    const pattern: LongRangePattern = {
      adversaryId,
      epochs,
      longRangeThreatVector,
      generatedAt: timestamp,
    };

    return {
      adversaryId,
      pattern,
      timestamp,
    };
  }
}
