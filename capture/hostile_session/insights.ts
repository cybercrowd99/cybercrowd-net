// capture/hostile_session/insights.ts
// Capture‑Net: Hostile Session Insights Organ

export class HostileSessionInsights {
  constructor(private env: any) {}

  /**
   * Produce high-level insights from analytics summary.
   */
  async summarize(analytics: any) {
    const insights: any[] = [];

    // --- High average risk insight ---
    if (analytics.riskScores?.length > 0) {
      const avg =
        analytics.riskScores.reduce((a: number, b: number) => a + b, 0) /
        analytics.riskScores.length;

      if (avg > 40) {
        insights.push({
          type: "high-average-risk",
          message: "Average risk score across hostile sessions is elevated",
          value: avg
        });
      }
    }

    // --- Escalation distribution anomalies ---
    const esc = analytics.escalationLevels || {};
    const critical = esc["critical"] || 0;
    const high = esc["high"] || 0;

    if (critical > 0 || high > 5) {
      insights.push({
        type: "escalation-anomaly",
        message: "Unusual number of high or critical escalation events detected",
        distribution: esc
      });
    }

    // --- Containment frequency insight ---
    if (analytics.containmentEvents > 0) {
      insights.push({
        type: "containment-frequency",
        message: "Multiple sessions reached containment or deep containment",
        count: analytics.containmentEvents
      });
    }

    return insights;
  }

  /**
   * Highlight clusters that show repeated adversary behavior.
   */
  async highlightClusters(clusters: Record<string, string[]>) {
    const highlights: any[] = [];

    for (const key of Object.keys(clusters)) {
      const group = clusters[key];
      if (group.length > 3) {
        highlights.push({
          cluster: key,
          count: group.length,
          message: `Cluster '${key}' shows repeated adversary behavior`
        });
      }
    }

    return highlights;
  }
}
