export interface ShadowIndexEnv {
  SHADOW_INDEX_KV: KVNamespace;
}

export interface ShadowIndexRecord {
  id: string;
  timestamp: number;
  ip: string | null;
  userAgent: string | null;
  path: string;
  method: string;
  disposition: "unknown" | "suspicious" | "hostile" | "benign";
  meta?: Record<string, unknown>;
}

export default {
  async fetch(request: Request, env: ShadowIndexEnv): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/shadow-index/record" && request.method === "POST") {
      const body = await request.json().catch(() => null);
      if (!body || typeof body !== "object") {
        return new Response("Invalid payload", { status: 400 });
      }

      const id = crypto.randomUUID();
      const now = Date.now();
      const cf = (request as any).cf || {};

      const record: ShadowIndexRecord = {
        id,
        timestamp: now,
        ip: cf.clientTcpRtt ? cf.colo : request.headers.get("cf-connecting-ip"),
        userAgent: request.headers.get("user-agent"),
        path: (body as any).path ?? url.pathname,
        method: (body as any).method ?? request.method,
        disposition: (body as any).disposition ?? "unknown",
        meta: (body as any).meta ?? {}
      };

      await env.SHADOW_INDEX_KV.put(`shadow:${id}`, JSON.stringify(record));

      return new Response(JSON.stringify({ ok: true, id }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }

    if (url.pathname === "/shadow-index/get" && request.method === "GET") {
      const id = url.searchParams.get("id");
      if (!id) {
        return new Response("Missing id", { status: 400 });
      }

      const stored = await env.SHADOW_INDEX_KV.get(`shadow:${id}`);
      if (!stored) {
        return new Response("Not found", { status: 404 });
      }

      return new Response(stored, {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }

    return new Response("Not Found", { status: 404 });
  }
};
