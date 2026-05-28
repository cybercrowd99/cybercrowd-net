export class SessionRiskScore {
    constructor(env) {
        this.env = env;
    }

    async score(sessionId, signals) {
        let score = 0;

        if (signals.entropy) {
            score += Math.min(signals.entropy * 10, 50);
        }

        if (signals.tags?.includes("bruteforce")) {
            score += 30;
        }

        if (signals.tags?.includes("high-entropy")) {
            score += 20;
        }

        if (signals.mirroredEvents && signals.mirroredEvents > 50) {
            score += 15;
        }

        if (signals.routing === "decoy") {
            score += 10;
        }

        await this.env.CAPTURE_NET_DB
            ?.prepare(
                `INSERT INTO session_risk (session_id, ts, score)
                 VALUES (?1, ?2, ?3)`
            )
            .bind(sessionId, Date.now(), score)
            .run();

        return score;
    }

    async getScore(sessionId) {
        const row = await this.env.CAPTURE_NET_DB
            ?.prepare(
                `SELECT score
                 FROM session_risk
                 WHERE session_id = ?1
                 ORDER BY ts DESC
                 LIMIT 1`
            )
            .bind(sessionId)
            .first();

        return row?.score || 0;
    }
}
