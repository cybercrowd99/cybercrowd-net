export class HostileSessionArchive {
    constructor(env) {
        this.env = env;
    }

    async archive(sessionId, exportBlob) {
        const key = `archive-${sessionId}-${Date.now()}.json`;

        await this.env.ARCHIVE_STORE
            ?.put(key, exportBlob);

        await this.env.CAPTURE_NET_DB
            ?.prepare(
                `INSERT INTO archive_index (session_id, ts, key)
                 VALUES (?1, ?2, ?3)`
            )
            .bind(sessionId, Date.now(), key)
            .run();

        return key;
    }

    async retrieve(key) {
        const blob = await this.env.ARCHIVE_STORE?.get(key);
        return blob || null;
    }

    async list(sessionId) {
        const rows = await this.env.CAPTURE_NET_DB
            ?.prepare(
                `SELECT ts, key
                 FROM archive_index
                 WHERE session_id = ?1
                 ORDER BY ts ASC`
            )
            .bind(sessionId)
            .all();

        return rows?.results || [];
    }
}
