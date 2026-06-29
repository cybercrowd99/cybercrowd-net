export { EphemeralPortAllocatorDurableObject } from "./src/ephemeral-port-allocator-durable-object";

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    /*
      CyberCrowd main site Worker

      Root lane only:
      - cybercrowd-net
      - assets
      - R2 teaser playlist
      - allocator Durable Object export
      - no auth ownership
      - no collapse ownership
      - no presence turnstile ownership
      - no secrets exposed
    */

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders(),
      });
    }

    if (url.pathname === "/api/health") {
      return jsonResponse({
        ok: true,
        worker: "cybercrowd-net",
        status: "alive",
        timestamp: new Date().toISOString(),
      });
    }

    if (url.pathname === "/api/r2-teaser-playlist") {
      return handleTeaserPlaylist(env);
    }

    if (url.pathname.startsWith("/api/auth/")) {
      return jsonResponse(
        {
          ok: false,
          error: "auth_route_not_handled_by_cybercrowd_net",
          message: "This route belongs to the CyberCrowd auth Worker.",
        },
        404
      );
    }

    if (env.ASSETS && typeof env.ASSETS.fetch === "function") {
      return env.ASSETS.fetch(request);
    }

    return new Response("CyberCrowd asset binding not available.", {
      status: 500,
      headers: {
        "content-type": "text/plain; charset=utf-8",
      },
    });
  },
};

async function handleTeaserPlaylist(env) {
  if (!env.TEASER_BUCKET) {
    return jsonResponse(
      {
        ok: false,
        error: "missing_teaser_bucket_binding",
      },
      500
    );
  }

  const listed = await env.TEASER_BUCKET.list();

  const tracks = listed.objects
    .filter((item) => item && item.key)
    .filter((item) => {
      const key = item.key.toLowerCase();

      return (
        key.endsWith(".mp3") ||
        key.endsWith(".wav") ||
        key.endsWith(".ogg") ||
        key.endsWith(".m4a")
      );
    })
    .map((item) => ({
      key: item.key,
      url: `/api/r2-teaser/${encodeURIComponent(item.key)}`,
      size: item.size || null,
      uploaded: item.uploaded || null,
    }));

  return jsonResponse({
    ok: true,
    count: tracks.length,
    tracks,
  });
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...corsHeaders(),
    },
  });
}

function corsHeaders() {
  return {
    "access-control-allow-origin": "https://cybercrowd.net",
    "access-control-allow-methods": "GET, POST, OPTIONS",
    "access-control-allow-headers": "content-type, authorization",
    "access-control-max-age": "86400",
  };
}
