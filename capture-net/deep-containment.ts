export class DeepContainment {
    constructor(env) {
        this.env = env;
    }

    async seal(sessionId, level) {
        const sealed = level === "critical" || level === "high";

        await this.env.CAPTURE_NET_DB
            ?.prepare(
                `INSERT INTO deep_containment (session_id, ts, sealed)
                 VALUES (?1, ?2, ?3)`
            )
            .bind(sessionId, Date.now(), sealed ? 1 : 0)
            .run();

        return sealed;
    }

    async isSealed(sessionId) {
        const row = await this.env.CAPTURE_NET_DB
            ?.prepare(
                `SELECT sealed
                 FROM deep_containment
                 WHERE session_id = ?1
                 ORDER BY ts DESC
                 LIMIT 1`
            )
            .bind(sessionId)
            .first();

        return row?.sealed === 1;
    }
}
