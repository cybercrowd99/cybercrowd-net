// capture/hostile_session/anomaly_detector.ts
// Capture‑Net: Hostile Session Anomaly Detector Organ

export class AnomalyDetector {
  constructor(private env: any) {}

  /**
   * Detect anomalies based on analytics summary and clustering output.
   */
  async detect(analytics: any, clusters: Record<string, string[]>) {
    const anomalies: any[] = [];

    // --- Risk score outlier detection ---
    if (analytics.riskScores?.length > 0) {
      const scores = analytics.riskScores;
      const avg = scores.reduce((a: number, b: number) => a + b, 0) / scores.length;
      const max = Math.max(...scores);

      if (max > avg * 2) {
        anomalies.push({
          type: "risk-outlier",
          message: "A session exhibits an unusually high risk score",
          value: max,
          baseline: avg
        });
      }
    }

    // --- Escalation imbalance detection ---
    const esc = analytics.escalationLevels || {};
    if ((esc.high || 0) > (esc.medium || 0) * 2) {
      anomalies.push({
        type: "escalation-imbalance",
        message: "High escalation events significantly exceed medium-level events",
        distribution: esc
      });
    }

    // --- Cluster irregularities (singleton clusters) ---
    for (const key of Object.keys(clusters)) {
      const group = clusters[key];
      if (group.length === 1) {
        anomalies.push({
          type: "singleton-cluster",
          message: `Cluster '${key}' contains only one session, indicating unique attacker behavior`,
          session: group[0]
        });
      }
    }

    return anomalies;
  }
}
