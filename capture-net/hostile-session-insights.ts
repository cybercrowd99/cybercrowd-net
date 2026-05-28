export class HostileSessionInsights {
    constructor(env) {
        this.env = env;
    }

    async summarize(analytics) {
        const insights = [];

        // Insight: high average risk
        if (analytics.riskScores?.length > 0) {
            const avg =
                analytics.riskScores.reduce((a, b) => a + b, 0) /
                analytics.riskScores.length;

            if (avg > 40) {
                insights.push({
                    type: "high-average-risk",
                    message: "Average risk score across hostile sessions is elevated",
                    value: avg
                });
            }
        }

        // Insight: escalation distribution anomalies
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

        // Insight: containment frequency
        if (analytics.containmentEvents > 0) {
            insights.push({
                type: "containment-frequency",
                message: "Multiple sessions reached containment or deep containment",
                count: analytics.containmentEvents
            });
        }

        return insights;
    }

    async highlightClusters(clusters) {
        const highlights = [];

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
