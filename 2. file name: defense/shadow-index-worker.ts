5. full doctype:
<!DOCTYPE html>
<script type="module">
// defense/shadow-index-worker.ts
// CyberCrowd Defense Layer — Shadow Index

import { Env } from "../types";
import { stamp } from "../utils/stamp";

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const now = Date.now();
    const payload = await safeParse(request);

    const shadowRecord = {
      id: crypto.randomUUID(),
      ts: now,
      route: payload?.route ?? "unknown",
      phantom: payload?.phantom ?? false,
      voidEvent: payload?.voidEvent ?? false,
      hollowTiming: payload?.hollowTiming ?? null,
      negativeSignature: payload?.negativeSignature ?? null,
      meta: {
        ip: request.headers.get("cf-connecting-ip") ?? "0.0.0.0",
        ua: request.headers.get("user-agent") ?? "unknown",
      },
      stamp: stamp("shadow-index"),
    };

    await env.SHADOW_INDEX.put(shadowRecord.id, JSON.stringify(shadowRecord));

    return new Response(
      JSON.stringify({
        status: "indexed",
        id: shadowRecord.id,
        ts: shadowRecord.ts,
      }),
      { headers: { "content-type": "application/json" } }
    );
  },
};

async function safeParse(request: Request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}
</script>
