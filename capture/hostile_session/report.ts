// capture/hostile_session/report.ts
// Capture‑Net: Hostile Session Report Organ

export class HostileSessionReport {
  constructor(private env: any) {}

  /**
   * Build a full forensic report for a hostile session.
   */
  async build(sessionId: string): Promise<{
    session: string;
    routing: any[];
    risk: any[];
    escalation: any[];
    containment: any[];
    lockdown: any[];
    audit: any[];
  }> {
    const db = this.env.CAPTURE_NET_DB;

    // Routing entropy + suspicious flag log
    const routing = await db
      ?.prepare(
        `SELECT ts, entropy, suspicious
         FROM routing_log
         WHERE session_id = ?1
         ORDER BY ts ASC`
      )
      .bind(sessionId)
      .all();

    // Risk scoring timeline
    const risk = await db
      ?.prepare(
        `SELECT ts, score
         FROM session_risk
         WHERE session_id = ?1
         ORDER BY ts ASC`
      )
      .bind(sessionId)
      .all();

    // Escalation level timeline
    const escalation = await db
      ?.prepare(
        `SELECT ts, level
         FROM escalation_log
         WHERE session_id = ?1
         ORDER BY ts ASC`
      )
      .bind(sessionId)
      .all();

    // Deep containment events
    const containment = await db
      ?.prepare(
        `SELECT ts, sealed
         FROM deep_containment
         WHERE session_id = ?1
         ORDER BY ts ASC`
      )
      .bind(sessionId)
      .all();

    // Final lockdown events
    const lockdown = await db
      ?.prepare(
        `SELECT ts, locked
         FROM final_lockdown
         WHERE session_id = ?1
         ORDER BY ts ASC`
      )
      .bind(sessionId)
      .all();

    // Immobilization audit trail
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
