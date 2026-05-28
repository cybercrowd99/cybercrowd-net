export class HostileSessionCatalog {
    constructor(env) {
        this.env = env;
    }

    async index(sessionId, attributes = {}) {
        await this.env.CAPTURE_NET_DB
            ?.prepare(
                `INSERT INTO hostile_catalog (session_id, ts, attributes)
                 VALUES (?1, ?2, ?3)`
            )
            .bind(
                sessionId,
                Date.now(),
                JSON.stringify(attributes || {})
            )
            .run();

        return true;
    }

    async query(filters = {}) {
        const rows = await this.env.CAPTURE_NET_DB
            ?.prepare(
                `SELECT session_id, ts, attributes
                 FROM hostile_catalog
                 ORDER BY ts ASC`
            )
            .all();

        const results = (rows?.results || []).map(r => ({
            session_id: r.session_id,
            ts: r.ts,
            attributes: JSON.parse(r.attributes || "{}")
        }));

        const keys = Object.keys(filters);
        if (keys.length === 0) return results;

        return results.filter(entry => {
            return keys.every(k => {
                return entry.attributes?.[k] === filters[k];
            });
        });
    }

    async get(sessionId) {
        const row = await this.env.CAPTURE_NET_DB
            ?.prepare(
                `SELECT session_id, ts, attributes
                 FROM hostile_catalog
                 WHERE session_id = ?1
                 LIMIT 1`
            )
            .bind(sessionId)
            .first();

        return row
            ? {
                  session_id: row.session_id,
                  ts: row.ts,
                  attributes: JSON.parse(row.attributes || "{}")
              }
            : null;
    }
}
