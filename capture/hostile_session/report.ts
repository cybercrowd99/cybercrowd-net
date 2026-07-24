// capture/hostile_session/report.ts
// Capture‑Net: Hostile Session Report Organ

Export class HostileSessionReport {
  Constructor(private env: any) {}

  /**
   * Build a full forensic report for a hostile session.
   */
  Async build(sessionId: string): Promise<{
    Session: string;
    Routing: any[];
    Risk: any[];
    Escalation: any[];
    Containment: any[];
    Lockdown: any[];
    Audit: any[];
  }> {
    Const db = this.env.CAPTURE_NET_DB;

    // Routing entropy + suspicious flag log
    Const routing = await db
      ?.prepare(
        `SELECT ts, entropy, suspicious
         FROM routing_log
         WHERE session_id = ?1
         ORDER BY ts ASC`
      )
      .bind(sessionId)
      .all();

    // Risk scoring timeline
    Const risk = await db
      ?.prepare(
        `SELECT ts, score
         FROM session_risk
         WHERE session_id = ?1
         ORDER BY ts ASC`
      )
      .bind(sessionId)
      .all();

    // Escalation level timeline
    Const escalation = await db
      ?.prepare(
        `SELECT ts, level
         FROM escalation_log
         WHERE session_id = ?1
         ORDER BY ts ASC`
      )
      .bind(sessionId)
      .all();

    // Deep containment events
    Const containment = await db
      ?.prepare(
        `SELECT ts, sealed
         FROM deep_containment
         WHERE session_id = ?1
         ORDER BY ts ASC`
      )
      .bind(sessionId)
      .all();

    // Final lockdown events
    Const lockdown = await db
      ?.prepare(
        `SELECT ts, locked
         FROM final_lockdown
         WHERE session_id = ?1
         ORDER BY ts ASC`
      )
      .bind(sessionId)
      .all();

    // Immobilization audit trail
    Const audit = await db
      ?.prepare(
        `SELECT ts, state
         FROM immobilization_audit
         WHERE session_id = ?1
         ORDER BY ts ASC`
      )
      .bind(sessionId)
      .all();

    Return {
      Session: sessionId,
      Routing: routing?.results || [],
      Risk: risk?.results || [],
      Escalation: escalation?.results || [],
      Containment: containment?.results || [],
      Lockdown: lockdown?.results || [],
      Audit: audit?.results || []
    };
  }
}
