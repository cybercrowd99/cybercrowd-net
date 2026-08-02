// capture/hostile_session/entropy-trap.ts
// Capture-Net: Entropy Trap Organ

export class EntropyTrap {
  constructor(private env: any) {}

  /**
   * Capture entropy signals from a hostile session.
   */
  async capture(sessionId: string, signal: any) {
    const entry = {
      session_id: sessionId,
      ts: Date.now(),
      signal
    };

    await this.env.CAPTURE_NET_DB
      ?.prepare(
        `INSERT INTO entropy_trap (session_id, ts, signal)
         VALUES (?1, ?2, ?3)`
      )
      .bind(sessionId, entry.ts, JSON.stringify(signal || {}))
      .run();

    return entry;
  }

  /**
   * Retrieve all entropy signals for a session.
   */
  async list(sessionId: string) {
    const rows = await this.env.CAPTURE_NET_DB
      ?.prepare(
        `SELECT ts, signal
         FROM entropy_trap
         WHERE session_id = ?1
         ORDER BY ts ASC`
      )
      .bind(sessionId)
      .all();

    return (rows?.results || []).map((r: any) => ({
      ts: r.ts,
      signal: JSON.parse(r.signal || "{}")
    }));
  }

  /**
   * Fetch the latest entropy signal.
   */
  async latest(sessionId: string) {
    const row = await this.env.CAPTURE_NET_DB
      ?.prepare(
        `SELECT ts, signal
         FROM entropy_trap
         WHERE session_id = ?1
         ORDER BY ts DESC
         LIMIT 1`
      )
      .bind(sessionId)
      .first();

    return row
      ? {
          ts: row.ts,
          signal: JSON.parse(row.signal || "{}")
        }
      : null;
  }
}
