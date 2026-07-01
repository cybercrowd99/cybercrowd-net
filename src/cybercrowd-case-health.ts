// src/cybercrowd-case-health.ts
//
// CyberCrowd Case Health Surface
//
// ONE JOB:
// Provide deterministic health checks for CyberCrowd CASE records.
//
// CASE HEALTH observes CASE condition.
// It does not punish.
// It does not become authority.
// It does not become NET.
// It is not a Worker route.
//
// No discovery.
// No dynamic imports.
// No hidden state.
// No fake adapters.

export type CyberCrowdCaseHealthState =
  | "healthy"
  | "watch"
  | "unstable"
  | "critical";

export interface CyberCrowdCaseHealthSource {
  case_id: string;
  state: string;
  events: Array<{ type: string; data: unknown; at: number }>;
  context: Record<string, unknown>;
}

export interface CyberCrowdCaseHealthScore {
  case_id: string;
  stable: boolean;
  anomalies: string[];
  volatility: number;
  completeness: number;
  integrity: number;
  score: number;
  state: CyberCrowdCaseHealthState;
  checked_at: number;
}

export interface CyberCrowdCaseHealthSnapshot {
  ok: boolean;
  scores: CyberCrowdCaseHealthScore[];
  total_cases: number;
  healthy: number;
  watch: number;
  unstable: number;
  critical: number;
}

class CyberCrowdCaseHealth {
  private scores = new Map<string, CyberCrowdCaseHealthScore>();

  check(source: CyberCrowdCaseHealthSource) {
    const score = this.computeScore(source);
    this.scores.set(source.case_id, score);

    return {
      ok: true,
      action: "cybercrowd_case_health_checked",
      case_id: source.case_id,
      score,
      snapshot: this.snapshot()
    };
  }

  checkBatch(sources: CyberCrowdCaseHealthSource[]) {
    const checked = sources.map((source) => {
      const score = this.computeScore(source);
      this.scores.set(source.case_id, score);
      return score;
    });

    return {
      ok: true,
      action: "cybercrowd_case_health_batch_checked",
      checked,
      snapshot: this.snapshot()
    };
  }

  get(case_id: string) {
    const score = this.scores.get(case_id);

    if (!score) {
      return {
        ok: false,
        error: "CASE_HEALTH_NOT_FOUND",
        case_id,
        snapshot: this.snapshot()
      };
    }

    return {
      ok: true,
      action: "cybercrowd_case_health_get",
      case_id,
      score
    };
  }

  snapshot(): CyberCrowdCaseHealthSnapshot {
    const scores = [...this.scores.values()];

    return {
      ok: true,
      scores,
      total_cases: scores.length,
      healthy: scores.filter((score) => score.state === "healthy").length,
      watch: scores.filter((score) => score.state === "watch").length,
      unstable: scores.filter((score) => score.state === "unstable").length,
      critical: scores.filter((score) => score.state === "critical").length
    };
  }

  reset() {
    this.scores.clear();

    return {
      ok: true,
      action: "cybercrowd_case_health_reset",
      snapshot: this.snapshot()
    };
  }

  private computeScore(source: CyberCrowdCaseHealthSource): CyberCrowdCaseHealthScore {
    const totalEvents = source.events.length;

    const volatility = totalEvents === 0 ? 0 : Math.min(1, totalEvents / 50);

    const completeness =
      source.state === "resolved" ||
      source.state === "released" ||
      source.state === "sealed" ||
      source.state === "exited" ||
      source.state === "analyzing"
        ? 1
        : 0.5;

    const requiredFields = ["operator", "origin", "intent"];
    const missingFields = requiredFields.filter((field) => !(field in source.context));

    const integrity = missingFields.length === 0 ? 1 : 0.4;

    const anomalies: string[] = [];

    if (missingFields.length > 0) {
      anomalies.push("MISSING_CONTEXT_FIELDS");
    }

    if (source.state === "burned") {
      anomalies.push("CASE_BURNED");
    }

    const rapidEvents = source.events.filter((event) => event.type === "rapid");

    if (rapidEvents.length > 5) {
      anomalies.push("EXCESSIVE_RAPID_EVENTS");
    }

    const score = Math.round(
      (completeness * 0.4 + integrity * 0.3 + (1 - volatility) * 0.3) * 100
    );

    const state =
      score >= 85 && anomalies.length === 0
        ? "healthy"
        : score >= 70
          ? "watch"
          : score >= 50
            ? "unstable"
            : "critical";

    return {
      case_id: source.case_id,
      stable: state === "healthy" || state === "watch",
      anomalies,
      volatility,
      completeness,
      integrity,
      score,
      state,
      checked_at: Date.now()
    };
  }
}

export const CyberCrowdCaseHealthSurface = new CyberCrowdCaseHealth();
