// capture/hostile_session/catalog.ts
// Capture‑Net: Hostile Session Catalog Organ

export class HostileSessionCatalog {
  constructor(private env: any) {}

  /**
   * Index a hostile session with arbitrary attributes.
   */
  async index(sessionId: string, attributes: Record<string, any> = {}) {
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

  /**
   * Query hostile catalog entries with optional attribute filters.
   */
  async query(filters: Record<string, any> = {}) {
    const rows = await this.env.CAPTURE_NET_DB
      ?.prepare(
        `SELECT session_id, ts, attributes
         FROM hostile_catalog
         ORDER BY ts ASC`
      )
      .all();

    const results = (rows?.results || []).map((r: any) => ({
      session_id: r.session_id,
      ts: r.ts,
      attributes: JSON.parse(r.attributes || "{}")
    }));

    const keys = Object.keys(filters);
    if (keys.length === 0) return results;

    return results.filter(entry =>
      keys.every(k => entry.attributes?.[k] === filters[k])
    );
  }

  /**
   * Retrieve a single hostile session entry by sessionId.
   */
  async get(sessionId: string) {
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
