export interface Env {
  BALLISTIC_DB: D1Database;
  SPONGE_DB: D1Database;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method !== "POST" || !url.pathname.startsWith("/sponge/")) {
      return new Response("Not found", { status: 404 });
    }

    const id = url.pathname.replace("/sponge/", "");
    if (!id) {
      return new Response("Missing id", { status: 400 });
    }

    const row = await env.BALLISTIC_DB
      .prepare(
        `SELECT id, filename, size_bytes, sha256, entropy, verdict, routed_action, status
         FROM ballistic_events
         WHERE id = ?1`
      )
      .bind(id)
      .first();

    if (!row) {
      return new Response("Unknown id", { status: 404 });
    }

    if (row.status !== "ROUTED") {
      return new Response("Invalid state", { status: 409 });
    }

    const now = new Date().toISOString();

    await env.SPONGE_DB
      .prepare(
        `INSERT INTO sponge_absorbed
         (event_id, filename, size_bytes, sha256, entropy, verdict, routed_action, absorbed_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)`
      )
      .bind(
        id,
        row.filename,
        row.size_bytes,
        row.sha256,
        row.entropy,
        row.verdict,
        row.routed_action,
        now
      )
      .run();

    await env.BALLISTIC_DB
      .prepare(
        `UPDATE ballistic_events
         SET status = ?1,
             absorbed_at = ?2
         WHERE id = ?3`
      )
      .bind("ABSORBED", now, id)
      .run();

    return new Response(
      JSON.stringify({
        id,
        status: "ABSORBED",
        verdict: row.verdict,
        action: row.routed_action,
        entropy: row.entropy,
        absorbed_at: now,
        note: "Event absorbed into long-term defensive intelligence."
      }),
      { status: 200, headers: { "content-type": "application/json" } }
    );
  }
};
