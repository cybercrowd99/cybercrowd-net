export class HostileSessionLedger {
    constructor(env) {
        this.env = env;
    }

    async record(sessionId, archiveKey, metadata = {}) {
        await this.env.CAPTURE_NET_DB
            ?.prepare(
                `INSERT INTO hostile_ledger (session_id, ts, archive_key, metadata)
                 VALUES (?1, ?2, ?3, ?4)`
            )
            .bind(
                sessionId,
                Date.now(),
                archiveKey,
                JSON.stringify(metadata || {})
            )
            .run();

        return true;
    }

    async lookup(sessionId) {
        const rows = await this.env.CAPTURE_NET_DB
            ?.prepare(
                `SELECT ts, archive_key, metadata
                 FROM hostile_ledger
                 WHERE session_id = ?1
                 ORDER BY ts ASC`
            )
            .bind(sessionId)
            .all();

        return rows?.results?.map(r => ({
            ts: r.ts,
            archive_key: r.archive_key,
            metadata: JSON.parse(r.metadata || "{}")
        })) || [];
    }

    async latest(sessionId) {
        const row = await this.env.CAPTURE_NET_DB
            ?.prepare(
                `SELECT ts, archive_key, metadata
                 FROM hostile_ledger
                 WHERE session_id = ?1
                 ORDER BY ts DESC
                 LIMIT 1`
            )
            .bind(sessionId)
            .first();

        return row
            ? {
                  ts: row.ts,
                  archive_key: row.archive_key,
                  metadata: JSON.parse(row.metadata || "{}")
              }
            : null;
    }
}
