// capture/hostile_session/intel.ts
// Capture‑Net: Hostile Session Intel Organ

export class HostileSessionIntel {
  constructor(private env: any) {}

  /**
   * Compile a unified intel object from analytics, insights, anomalies, and clusters.
   */
  async compile({
    analytics,
    insights,
    anomalies,
    clusters
  }: {
    analytics: any;
    insights: any[];
    anomalies: any[];
    clusters: Record<string, string[]>;
  }) {
    const intel: any = {
      generated: Date.now(),
      summary: {},
      insights: insights || [],
      anomalies: anomalies || [],
      clusters: clusters || {},
      analytics: analytics || {}
    };

    // --- Risk posture summary ---
    const riskScores = analytics?.riskScores || [];
    if (riskScores.length > 0) {
      const avg =
        riskScores.reduce((a: number, b: number) => a + b, 0) /
        riskScores.length;
      const max = Math.max(...riskScores);

      intel.summary.risk = {
        average: avg,
        peak: max,
        posture:
          max > 70
            ? "critical"
            : max > 40
            ? "high"
            : max > 20
            ? "elevated"
            : "low"
      };
    }

    // --- Escalation posture summary ---
    const esc = analytics?.escalationLevels || {};
    const critical = esc["critical"] || 0;
    const high = esc["high"] || 0;

    intel.summary.escalation = {
      distribution: esc,
      posture:
        critical > 0
          ? "critical"
          : high > 3
          ? "high"
          : "normal"
    };

    // --- Containment posture summary ---
    intel.summary.containment = {
      events: analytics?.containmentEvents || 0,
      posture:
        (analytics?.containmentEvents || 0) > 0
          ? "active"
          : "none"
    };

    return intel;
  }
}
