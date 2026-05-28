export class HostileSessionReport {
    constructor(env) {
        this.env = env;
    }

    async build(sessionId) {
        const db = this.env.CAPTURE_NET_DB;

        const routing = await db
            ?.prepare(
                `SELECT ts, entropy, suspicious
                 FROM routing_log
                 WHERE session_id = ?1
                 ORDER BY ts ASC`
            )
            .bind(sessionId)
            .all();

        const risk = await db
            ?.prepare(
                `SELECT ts, score
                 FROM session_risk
                 WHERE session_id = ?1
                 ORDER BY ts ASC`
            )
            .bind(sessionId)
            .all();

        const escalation = await db
            ?.prepare(
                `SELECT ts, level
                 FROM escalation_log
                 WHERE session_id = ?1
                 ORDER BY ts ASC`
            )
            .bind(sessionId)
            .all();

        const containment = await db
            ?.prepare(
                `SELECT ts, sealed
                 FROM deep_containment
                 WHERE session_id = ?1
                 ORDER BY ts ASC`
            )
            .bind(sessionId)
            .all();

        const lockdown = await db
            ?.prepare(
                `SELECT ts, locked
                 FROM final_lockdown
                 WHERE session_id = ?1
                 ORDER BY ts ASC`
            )
            .bind(sessionId)
            .all();

        const audit = await db
            ?.prepare(
                `SELECT ts, state
                 FROM immobilization_audit
                 WHERE session_id = ?1
                 ORDER BY ts ASC`
            )
            .bind(sessionId)
            .all();

        return {
            session: sessionId,
            routing: routing?.results || [],
            risk: risk?.results || [],
            escalation: escalation?.results || [],
            containment: containment?.results || [],
            lockdown: lockdown?.results || [],
            audit: audit?.results || []
        };
    }
}
