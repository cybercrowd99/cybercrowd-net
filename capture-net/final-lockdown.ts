export class FinalLockdown {
    constructor(env) {
        this.env = env;
    }

    async lock(sessionId) {
        await this.env.CAPTURE_NET_DB
            ?.prepare(
                `INSERT INTO final_lockdown (session_id, ts, locked)
                 VALUES (?1, ?2, 1)`
            )
            .bind(sessionId, Date.now())
            .run();

        return true;
    }

    async isLocked(sessionId) {
        const row = await this.env.CAPTURE_NET_DB
            ?.prepare(
                `SELECT locked
                 FROM final_lockdown
                 WHERE session_id = ?1
                 ORDER BY ts DESC
                 LIMIT 1`
            )
            .bind(sessionId)
            .first();

        return row?.locked === 1;
    }
}
