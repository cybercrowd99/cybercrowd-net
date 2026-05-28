export class HostileSessionIntel {
    constructor(env) {
        this.env = env;
    }

    async compile({ analytics, insights, anomalies, clusters }) {
        const intel = {
            generated: Date.now(),
            summary: {},
            insights: insights || [],
            anomalies: anomalies || [],
            clusters: clusters || {},
            analytics: analytics || {}
        };

        // Summary: high-level threat posture
        const riskScores = analytics?.riskScores || [];
        if (riskScores.length > 0) {
            const avg =
                riskScores.reduce((a, b) => a + b, 0) / riskScores.length;
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

        // Summary: escalation posture
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

        // Summary: containment posture
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
