export class HostileSessionRegistry {
    constructor(env) {
        this.env = env;
    }

    async register(sessionId, archiveKey, ledgerKey) {
        await this.env.CAPTURE_NET_DB
            ?.prepare(
                `INSERT INTO hostile_registry (session_id, ts, archive_key, ledger_key)
                 VALUES (?1, ?2, ?3, ?4)`
            )
            .bind(
                sessionId,
                Date.now(),
                archiveKey,
                ledgerKey
            )
            .run();

        return true;
    }

    async list() {
        const rows = await this.env.CAPTURE_NET_DB
            ?.prepare(
                `SELECT session_id, ts, archive_key, ledger_key
                 FROM hostile_registry
                 ORDER BY ts ASC`
            )
            .all();

        return rows?.results || [];
    }

    async get(sessionId) {
        const row = await this.env.CAPTURE_NET_DB
            ?.prepare(
                `SELECT session_id, ts, archive_key, ledger_key
                 FROM hostile_registry
                 WHERE session_id = ?1
                 LIMIT 1`
            )
            .bind(sessionId)
            .first();

        return row || null;
    }
}
