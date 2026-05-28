export class HostileSessionExport {
    constructor(env) {
        this.env = env;
    }

    async exportJSON(sessionId, report) {
        const blob = JSON.stringify(report, null, 2);

        await this.env.EXPORT_OUTBOX
            ?.put(
                `session-${sessionId}-${Date.now()}.json`,
                blob
            );

        return blob;
    }

    async exportText(sessionId, report) {
        const lines = [];

        lines.push(`Session: ${sessionId}`);
        lines.push(`Generated: ${new Date().toISOString()}`);
        lines.push("");

        const sections = [
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

        await this.env.EXPORT_OUTBOX
            ?.put(
                `session-${sessionId}-${Date.now()}.txt`,
                text
            );

        return text;
    }
}
