export interface Env {
  BALLISTIC_DB: D1Database;
}

type Verdict = "BENIGN" | "SUSPICIOUS" | "HOSTILE" | "UNKNOWN";
type Action = "ARCHIVE" | "PURGE" | "ESCALATE" | "IGNORE";

export default {
  async route(id: string, env: Env) {
    const row = await env.BALLISTIC_DB
      .prepare(
        `SELECT verdict, status
         FROM ballistic_events
         WHERE id = ?1`
      )
      .bind(id)
      .first();

    if (!row) return null;
    if (row.status !== "CURED") return null;

    const verdict = (row.verdict || "UNKNOWN") as Verdict;

    let action: Action = "IGNORE";

    switch (verdict) {
      case "BENIGN":
        action = "ARCHIVE";
        break;
      case "SUSPICIOUS":
        action = "ESCALATE";
        break;
      case "HOSTILE":
        action = "PURGE";
        break;
      default:
        action = "ESCALATE";
        break;
    }

    return {
      id,
      verdict,
      action,
      routed_at: new Date().toISOString()
    };
  }
};
