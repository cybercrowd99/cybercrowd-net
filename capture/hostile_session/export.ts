// capture/hostile_session/export.ts
// Capture‑Net: Hostile Session Export Organ

export class HostileSessionExport {
  constructor(private env: any) {}

  /**
   * Export a session report as JSON.
   */
  async exportJSON(sessionId: string, report: any) {
    const blob = JSON.stringify(report, null, 2);
    const key = `session-${sessionId}-${Date.now()}.json`;

    await this.env.EXPORT_OUTBOX?.put(key, blob);

    return blob;
  }

  /**
   * Export a session report as human-readable text.
   */
  async exportText(sessionId: string, report: any) {
    const lines: string[] = [];

    lines.push(`Session: ${sessionId}`);
    lines.push(`Generated: ${new Date().toISOString()}`);
    lines.push("");

    const sections: [string, any[]][] = [
      ["Routing", report.routing],
      ["Risk Scores", report.risk],
      ["Escalation", report.escalation],
      ["Containment", report.containment],
      ["Lockdown", report.lockdown],
      ["Audit Trail", report.audit]
    ];

    for (const [title, data] of sections) {
      lines.push(`=== ${title} ===`);
      for (const entry of data) {
        lines.push(JSON.stringify(entry));
      }
      lines.push("");
    }

    const text = lines.join("\n");
    const key = `session-${sessionId}-${Date.now()}.txt`;

    await this.env.EXPORT_OUTBOX?.put(key, text);

    return text;
  }
}
