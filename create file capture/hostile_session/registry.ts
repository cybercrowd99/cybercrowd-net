// capture/hostile_session/registry.ts
// Capture‑Net: Hostile Session Registry Organ

export class HostileSessionRegistry {
  constructor(private env: any) {}

  /**
   * Register a hostile session with archive + ledger linkage.
   */
  async register(
    sessionId: string,
    archiveKey: string,
    ledgerKey: string
  ): Promise<boolean> {
    await this.env.CAPTURE_NET_DB
      ?.prepare(
        `INSERT INTO hostile_registry (session_id, ts, archive_key, ledger_key)
         VALUES (?1, ?2, ?3, ?4)`
      )
      .bind(sessionId, Date.now(), archiveKey, ledgerKey)
      .run();

    return true;
  }

  /**
   * List all hostile sessions in chronological order.
   */
  async list(): Promise<
    { session_id: string; ts: number; archive_key: string; ledger_key: string }[]
  > {
    const rows = await this.env.CAPTURE_NET_DB
      ?.prepare(
        `SELECT session_id, ts, archive_key, ledger_key
         FROM hostile_registry
         ORDER BY ts ASC`
      )
      .all();

    return rows?.results || [];
  }

  /**
   * Retrieve a single hostile session record.
   */
  async get(
    sessionId: string
  ): Promise<{
    session_id: string;
    ts: number;
    archive_key: string;
    ledger_key: string;
  } | null> {
    const row = await this.env.CAPTURE_NET_DB
      ?.prepare(
        `SELECT session_id, ts, archive_key, ledger_key
         FROM hostile_registry
         WHERE session_id = ?1
         LIMIT 1`
      )
      .bind(sessionId)
      .first();

    return row || null;
  }
}
