export interface Env {
  BALLISTIC_R2: R2Bucket;
  BALLISTIC_DB: D1Database;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method !== "POST" || !url.pathname.startsWith("/dummy/")) {
      return new Response("Not found", { status: 404 });
    }

    const id = url.pathname.replace("/dummy/", "");
    if (!id) {
      return new Response("Missing id", { status: 400 });
    }

    const row = await env.BALLISTIC_DB
      .prepare(
        `SELECT object_key, status
         FROM ballistic_events
         WHERE id = ?1`
      )
      .bind(id)
      .first();

    if (!row) {
      return new Response("Unknown id", { status: 404 });
    }

    if (row.status !== "CURED" && row.status !== "QUARANTINED") {
      return new Response("Invalid state", { status: 409 });
    }

    const object = await env.BALLISTIC_R2.get(row.object_key);
    if (!object) {
      return new Response("Payload missing", { status: 410 });
    }

    const now = new Date().toISOString();

    await env.BALLISTIC_DB
      .prepare(
        `UPDATE ballistic_events
         SET status = ?1, dummy_prepared_at = ?2
         WHERE id = ?3`
      )
      .bind("DUMMY_PREPARED", now, id)
      .run();

    return new Response(
      JSON.stringify({
        id,
        status: "DUMMY_PREPARED",
        prepared_at: now,
        note:
          "Isolated execution context prepared. Actual execution must occur in a separate, hardened environment."
      }),
      { status: 200, headers: { "content-type": "application/json" } }
    );
  }
};
