export interface Env {
  BALLISTIC_R2: R2Bucket;
  BALLISTIC_DB: D1Database;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method !== "POST") {
      return new Response("Use POST /ingest", { status: 405 });
    }

    const url = new URL(request.url);
    if (url.pathname !== "/ingest") {
      return new Response("Not found", { status: 404 });
    }

    const contentType = request.headers.get("content-type") || "";
    if (!contentType.includes("multipart/form-data")) {
      return new Response("Expected multipart/form-data", { status: 400 });
    }

    const form = await request.formData();
    const file = form.get("file");

    if (!(file instanceof File)) {
      return new Response("Missing file", { status: 400 });
    }

    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const key = `quarantine/${id}/${file.name || "payload.bin"}`;

    await env.BALLISTIC_R2.put(key, await file.arrayBuffer(), {
      httpMetadata: { contentType: file.type || "application/octet-stream" }
    });

    await env.BALLISTIC_DB
      .prepare(
        `INSERT INTO ballistic_events
         (id, object_key, filename, size_bytes, created_at, status)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6)`
      )
      .bind(id, key, file.name || null, file.size, now, "QUARANTINED")
      .run();

    return new Response(
      JSON.stringify({
        id,
        status: "QUARANTINED",
        created_at: now
      }),
      { status: 202, headers: { "content-type": "application/json" } }
    );
  }
};
 
