// capture/deep_containment.ts
// Capture‑Net: Deep Containment Organ

export class DeepContainment {
  constructor(env: any) {
    this.env = env;
  }

  env: any;

  /**
   * Seal a session at a given containment level.
   * Levels "high" or "critical" produce a sealed state.
   */
  async seal(sessionId: string, level: string) {
    const sealed = level === "critical" || level === "high";

    await this.env.CAPTURE_NET_DB
      ?.prepare(
        `INSERT INTO deep_containment (session_id, ts, sealed)
         VALUES (?1, ?2, ?3)`
      )
      .bind(sessionId, Date.now(), sealed ? 1 : 0)
      .run();

    return sealed;
  }

  /**
   * Check whether a session is currently sealed.
   * Returns true if the most recent record indicates sealed = 1.
   */
  async isSealed(sessionId: string) {
    const row = await this.env.CAPTURE_NET_DB
      ?.prepare(
        `SELECT sealed
         FROM deep_containment
         WHERE session_id = ?1
         ORDER BY ts DESC
         LIMIT 1`
      )
      .bind(sessionId)
      .first();

    return row?.sealed === 1;
  }
}
