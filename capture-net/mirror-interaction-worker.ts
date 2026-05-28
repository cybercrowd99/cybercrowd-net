export class MirrorInteractionWorker {
    constructor(env) {
        this.env = env;
    }

    async record(event) {
        await this.env.CAPTURE_NET_DB
            ?.prepare(
                `INSERT INTO mirrored_events (session_id, ts, type, payload)
                 VALUES (?1, ?2, ?3, ?4)`
            )
            .bind(
                event.session,
                Date.now(),
                event.type,
                JSON.stringify(event.payload || {})
            )
            .run();
    }

    async replay(sessionId) {
        const rows = await this.env.CAPTURE_NET_DB
            ?.prepare(
                `SELECT ts, type, payload
                 FROM mirrored_events
                 WHERE session_id = ?1
                 ORDER BY ts ASC`
            )
            .bind(sessionId)
            .all();

        return rows?.results?.map(r => ({
            ts: r.ts,
            type: r.type,
            payload: JSON.parse(r.payload || "{}")
        })) || [];
    }
}
