export interface Env {
  BALLISTIC_R2: R2Bucket;
  BALLISTIC_DB: D1Database;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method !== "POST" || !url.pathname.startsWith("/cure/")) {
      return new Response("Not found", { status: 404 });
    }

    const id = url.pathname.replace("/cure/", "");
    if (!id) {
      return new Response("Missing id", { status: 400 });
    }

    const row = await env.BALLISTIC_DB
      .prepare("SELECT object_key FROM ballistic_events WHERE id = ?1")
      .bind(id)
      .first();

    if (!row) {
      return new Response("Unknown id", { status: 404 });
    }

    const object = await env.BALLISTIC_R2.get(row.object_key);
    if (!object) {
      return new Response("Payload missing", { status: 410 });
    }

    const bytes = await object.arrayBuffer();
    const size = bytes.byteLength;

    const hash = await crypto.subtle.digest("SHA-256", bytes);
    const hashHex = [...new Uint8Array(hash)]
      .map(b => b.toString(16).padStart(2, "0"))
      .join("");

    const now = new Date().toISOString();

    await env.BALLISTIC_DB
      .prepare(
        `UPDATE ballistic_events
         SET status = ?1, analyzed_at = ?2, sha256 = ?3, observed_size = ?4
         WHERE id = ?5`
      )
      .bind("CURED", now, hashHex, size, id)
      .run();

    return new Response(
      JSON.stringify({
        id,
        status: "CURED",
        sha256: hashHex,
        observed_size: size,
        analyzed_at: now
      }),
      { status: 200, headers: { "content-type": "application/json" } }
    );
  }
};
