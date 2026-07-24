// capture/hostile_session/ledger.ts
// Capture‑Net: Hostile Session Ledger Organ

Export class HostileSessionLedger {
  Constructor(private env: any) {}

  /**
   * Record an archival event for a hostile session.
   */
  Async record(sessionId: string, archiveKey: string, metadata: Record<string, any> = {}) {
    Await this.env.CAPTURE_NET_DB
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

    Return true;
  }

  /**
   * Retrieve all ledger entries for a session in chronological order.
   */
  Async lookup(sessionId: string) {
    Const rows = await this.env.CAPTURE_NET_DB
      ?.prepare(
        `SELECT ts, archive_key, metadata
         FROM hostile_ledger
         WHERE session_id = ?1
         ORDER BY ts ASC`
      )
      .bind(sessionId)
      .all();

    Return (
      Rows?.results?.map((r: any) => ({
        Ts: r.ts,
        Archive_key: r.archive_key,
        Metadata: JSON.parse(r.metadata || “{}”)
      })) || []
    );
  }

  /**
   * Retrieve the latest ledger entry for a session.
   */
  Async latest(sessionId: string) {
    Const row = await this.env.CAPTURE_NET_DB
      ?.prepare(
        `SELECT ts, archive_key, metadata
         FROM hostile_ledger
         WHERE session_id = ?1
         ORDER BY ts DESC
         LIMIT 1`
      )
      .bind(sessionId)
      .first();

    Return row
      ? {
          Ts: row.ts,
          Archive_key: row.archive_key,
          Metadata: JSON.parse(row.metadata || “{}”)
        }
      : null;
  }
}
