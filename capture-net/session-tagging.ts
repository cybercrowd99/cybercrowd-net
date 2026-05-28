export class SessionTagging {
    constructor(env) {
        this.env = env;
    }

    async tag(sessionId, signals) {
        const tags = [];

        if (signals.entropy && signals.entropy > 4.5) {
            tags.push("high-entropy");
        }

        if (signals.bruteforce) {
            tags.push("bruteforce");
        }

        if (signals.mirroredEvents && signals.mirroredEvents > 50) {
            tags.push("high-activity");
        }

        if (signals.routing === "decoy") {
            tags.push("decoy-routed");
        }

        await this.env.CAPTURE_NET_DB
            ?.prepare(
                `INSERT INTO session_tags (session_id, ts, tags)
                 VALUES (?1, ?2, ?3)`
            )
            .bind(sessionId, Date.now(), JSON.stringify(tags))
            .run();

        return tags;
    }

    async getTags(sessionId) {
        const rows = await this.env.CAPTURE_NET_DB
            ?.prepare(
                `SELECT ts, tags
                 FROM session_tags
                 WHERE session_id = ?1
                 ORDER BY ts ASC`
            )
            .bind(sessionId)
            .all();

        return rows?.results?.map(r => ({
            ts: r.ts,
            tags: JSON.parse(r.tags || "[]")
        })) || [];
    }
}
