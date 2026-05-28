export interface Env {
  BALLISTIC_DB: D1Database;
}

type RouteAction =
  | "ARCHIVE"
  | "PURGE"
  | "ESCALATE"
  | "IGNORE";

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method !== "POST" || !url.pathname.startsWith("/route/")) {
      return new Response("Not found", { status: 404 });
    }

    const id = url.pathname.replace("/route/", "");
    if (!id) {
      return new Response("Missing id", { status: 400 });
    }

    const row = await env.BALLISTIC_DB
      .prepare(
        `SELECT id, filename, size_bytes, sha256, entropy, status, verdict
         FROM ballistic_events
         WHERE id = ?1`
      )
      .bind(id)
      .first();

    if (!row) {
      return new Response("Unknown id", { status: 404 });
    }

    if (row.status !== "DISPOSED") {
      return new Response("Invalid state", { status: 409 });
    }

    const verdict = (row.verdict || "UNKNOWN") as string;

    let action: RouteAction = "IGNORE";

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

    const now = new Date().toISOString();

    await env.BALLISTIC_DB
      .prepare(
        `UPDATE ballistic_events
         SET routed_action = ?1,
             routed_at = ?2,
             status = ?3
         WHERE id = ?4`
      )
      .bind(action, now, "ROUTED", id)
      .run();

    return new Response(
      JSON.stringify({
        id,
        status: "ROUTED",
        action,
        verdict,
        filename: row.filename,
        size_bytes: row.size_bytes,
        sha256: row.sha256,
        entropy: row.entropy,
        routed_at: now
      }),
      { status: 200, headers: { "content-type": "application/json" } }
    );
  }
};
