export class ImmobilizationAudit {
    constructor(env) {
        this.env = env;
    }

    async record(sessionId, state) {
        await this.env.CAPTURE_NET_DB
            ?.prepare(
                `INSERT INTO immobilization_audit (session_id, ts, state)
                 VALUES (?1, ?2, ?3)`
            )
            .bind(sessionId, Date.now(), state)
            .run();

        return true;
    }

    async history(sessionId) {
        const rows = await this.env.CAPTURE_NET_DB
            ?.prepare(
                `SELECT ts, state
                 FROM immobilization_audit
                 WHERE session_id = ?1
                 ORDER BY ts ASC`
            )
            .bind(sessionId)
            .all();

        return rows?.results || [];
    }
}
