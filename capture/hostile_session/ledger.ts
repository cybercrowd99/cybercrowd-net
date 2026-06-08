// capture/hostile_session/ledger.ts
// Capture‑Net: Hostile Session Ledger Organ

export class HostileSessionLedger {
  constructor(private env: any) {}

  /**
   * Record an archival event for a hostile session.
   */
  async record(sessionId: string, archiveKey: string, metadata: Record<string, any> = {}) {
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

  /**
   * Retrieve all ledger entries for a session in chronological order.
   */
  async lookup(sessionId: string) {
    const rows = await this.env.CAPTURE_NET_DB
      ?.prepare(
        `SELECT ts, archive_key, metadata
         FROM hostile_ledger
         WHERE session_id = ?1
         ORDER BY ts ASC`
      )
      .bind(sessionId)
      .all();

    return (
      rows?.results?.map((r: any) => ({
        ts: r.ts,
        archive_key: r.archive_key,
        metadata: JSON.parse(r.metadata || "{}")
      })) || []
    );
  }

  /**
   * Retrieve the latest ledger entry for a session.
   */
  async latest(sessionId: string) {
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
