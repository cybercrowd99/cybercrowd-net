export class EscalationEngine {
    constructor(env) {
        this.env = env;
    }

    async escalate(sessionId, riskScore) {
        let level = "low";

        if (riskScore > 70) {
            level = "critical";
        } else if (riskScore > 40) {
            level = "high";
        } else if (riskScore > 20) {
            level = "medium";
        }

        await this.env.CAPTURE_NET_DB
            ?.prepare(
                `INSERT INTO escalation_log (session_id, ts, level)
                 VALUES (?1, ?2, ?3)`
            )
            .bind(sessionId, Date.now(), level)
            .run();

        return level;
    }

    async getLevel(sessionId) {
        const row = await this.env.CAPTURE_NET_DB
            ?.prepare(
                `SELECT level
                 FROM escalation_log
                 WHERE session_id = ?1
                 ORDER BY ts DESC
                 LIMIT 1`
            )
            .bind(sessionId)
            .first();

        return row?.level || "low";
    }
}
