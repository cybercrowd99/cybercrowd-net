// capture/escalation_engine.ts
// Capture‑Net: Escalation Engine Organ

export class EscalationEngine {
  constructor(env: any) {
    this.env = env;
  }

  env: any;

  /**
   * Compute escalation level from risk score.
   * Thresholds:
   *   >70  → critical
   *   >40  → high
   *   >20  → medium
   *   else → low
   */
  async escalate(sessionId: string, riskScore: number) {
    let level = "low";

    if (riskScore > 70) {
      level = "critical";
    } else if (riskScore > 40) {
      level = "high";
    } else if (riskScore > 20) {
      level = "medium";
    }

    await this.env.CAPTURE_NET_DB
      ?.prepare(
        `INSERT INTO escalation_log (session_id, ts, level)
         VALUES (?1, ?2, ?3)`
      )
      .bind(sessionId, Date.now(), level)
      .run();

    return level;
  }

  /**
   * Retrieve the most recent escalation level for a session.
   */
  async getLevel(sessionId: string) {
    const row = await this.env.CAPTURE_NET_DB
      ?.prepare(
        `SELECT level
         FROM escalation_log
         WHERE session_id = ?1
         ORDER BY ts DESC
         LIMIT 1`
      )
      .bind(sessionId)
      .first();

    return row?.level || "low";
  }
}
