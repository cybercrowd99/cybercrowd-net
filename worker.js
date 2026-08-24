export {
  EphemeralPortAllocatorDurableObject
} from "./src/ephemeral-port-allocator-durable-object";

export default {
  async fetch(request, env, ctx) {
    const url =
      new URL(request.url);

    /*
      CYBERCROWD MAIN SITE WORKER

      PUBLIC:
      cybercrowd-net

      PRIVATE R2:
      SOUND_EFFECTS

      SOUND FLOW:

      browser
      ↓
      /api/r2-sound-effect/Surface-closing_1sEffect.mp3
      ↓
      SOUND_EFFECTS
      ↓
      Surface-closing_1sEffect.mp3
    */

    if (
      request.method === "OPTIONS"
    ) {
      return new Response(
        null,
        {
          status: 204,
          headers: corsHeaders()
        }
      );
    }

    if (
      url.pathname ===
      "/api/health"
    ) {
      return jsonResponse({
        ok: true,
        worker: "cybercrowd-net",
        status: "alive",
        timestamp:
          new Date().toISOString()
      });
    }

    if (
      url.pathname ===
      "/api/r2-teaser-playlist"
    ) {
      return handleTeaserPlaylist(
        env
      );
    }

    if (
      request.method === "GET" &&
      url.pathname ===
        "/api/r2-sound-effect/Surface-closing_1sEffect.mp3"
    ) {
      return handleSurfaceClosingSound(
        request,
        env
      );
    }

    if (
      url.pathname.startsWith(
        "/api/auth/"
      )
    ) {
      return jsonResponse(
        {
          ok: false,
          error:
            "auth_route_not_handled_by_cybercrowd_net",
          message:
            "This route belongs to the CyberCrowd auth Worker."
        },
        404
      );
    }

    if (
      env.ASSETS &&
      typeof env.ASSETS.fetch ===
        "function"
    ) {
      return env.ASSETS.fetch(
        request
      );
    }

    return new Response(
      "CyberCrowd asset binding not available.",
      {
        status: 500,
        headers: {
          "content-type":
            "text/plain; charset=utf-8"
        }
      }
    );
  }
};

async function handleSurfaceClosingSound(
  request,
  env
) {
  if (!env.SOUND_EFFECTS) {
    return new Response(
      "Sound effects binding unavailable.",
      {
        status: 500,
        headers: {
          "content-type":
            "text/plain; charset=utf-8"
        }
      }
    );
  }

  const key =
    "Surface-closing_1sEffect.mp3";

  const rangeHeader =
    request.headers.get("range");

  const getOptions =
    rangeHeader
      ? {
          range:
            request.headers
        }
      : undefined;

  const object =
    await env.SOUND_EFFECTS.get(
      key,
      getOptions
    );

  if (!object) {
    return new Response(
      "Sound effect not found.",
      {
        status: 404,
        headers: {
          "content-type":
            "text/plain; charset=utf-8"
        }
      }
    );
  }

  const headers =
    new Headers();

  object.writeHttpMetadata(
    headers
  );

  headers.set(
    "content-type",
    object.httpMetadata
      ?.contentType ||
      "audio/mpeg"
  );

  headers.set(
    "accept-ranges",
    "bytes"
  );

  headers.set(
    "cache-control",
    "public, max-age=86400"
  );

  headers.set(
    "etag",
    object.httpEtag
  );

  if (
    object.range &&
    typeof object.range.offset ===
      "number" &&
    typeof object.range.length ===
      "number"
  ) {
    const start =
      object.range.offset;

    const end =
      start +
      object.range.length -
      1;

    headers.set(
      "content-range",
      `bytes ${start}-${end}/${object.size}`
    );

    headers.set(
      "content-length",
      String(
        object.range.length
      )
    );

    return new Response(
      object.body,
      {
        status: 206,
        headers
      }
    );
  }

  headers.set(
    "content-length",
    String(object.size)
  );

  return new Response(
    object.body,
    {
      status: 200,
      headers
    }
  );
}

async function handleTeaserPlaylist(
  env
) {
  if (!env.TEASER_BUCKET) {
    return jsonResponse(
      {
        ok: false,
        error:
          "missing_teaser_bucket_binding"
      },
      500
    );
  }

  const listed =
    await env.TEASER_BUCKET.list();

  const tracks =
    listed.objects
      .filter(
        (item) =>
          item &&
          item.key
      )
      .filter(
        (item) => {
          const key =
            item.key.toLowerCase();

          return (
            key.endsWith(".mp3") ||
            key.endsWith(".wav") ||
            key.endsWith(".ogg") ||
            key.endsWith(".m4a")
          );
        }
      )
      .map(
        (item) => ({
          key: item.key,
          url:
            `/api/r2-teaser/${encodeURIComponent(
              item.key
            )}`,
          size:
            item.size || null,
          uploaded:
            item.uploaded || null
        })
      );

  return jsonResponse({
    ok: true,
    count: tracks.length,
    tracks
  });
}

function jsonResponse(
  data,
  status = 200
) {
  return new Response(
    JSON.stringify(
      data,
      null,
      2
    ),
    {
      status,
      headers: {
        "content-type":
          "application/json; charset=utf-8",
        ...corsHeaders()
      }
    }
  );
}

function corsHeaders() {
  return {
    "access-control-allow-origin":
      "https://cybercrowd.net",
    "access-control-allow-methods":
      "GET, POST, OPTIONS",
    "access-control-allow-headers":
      "content-type, authorization",
    "access-control-max-age":
      "86400"
  };
}
