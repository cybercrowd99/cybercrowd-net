export class TelemetrySiphon {
    constructor(env) {
        this.env = env;
    }

    async collect(sessionId) {
        const events = await this.env.CAPTURE_NET_DB
            ?.prepare(
                `SELECT ts, type, payload
                 FROM mirrored_events
                 WHERE session_id = ?1
                 ORDER BY ts ASC`
            )
            .bind(sessionId)
            .all();

        const logs = await this.env.CAPTURE_NET_DB
            ?.prepare(
                `SELECT ts, type, detail
                 FROM guard_logs
                 WHERE session_id = ?1
                 ORDER BY ts ASC`
            )
            .bind(sessionId)
            .all();

        return {
            session: sessionId,
            events: events?.results || [],
            logs: logs?.results || []
        };
    }

    async forward(telemetry) {
        await this.env.TELEMETRY_OUTBOX
            ?.put(
                `session-${telemetry.session}-${Date.now()}.json`,
                JSON.stringify(telemetry)
            );
    }
}
