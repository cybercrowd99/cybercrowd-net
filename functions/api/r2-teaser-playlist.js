export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "GET, OPTIONS",
      "access-control-allow-headers": "content-type"
    }
  });
}

export async function onRequestGet(context) {
  const PUBLIC_R2_BASE = "https://pub-660d879738134ba990d1708d015ec763.r2.dev/";
  const AUDIO_FILE_PATTERN = /\.(mp3|m4a|wav|ogg|aac)$/i;

  function encodeR2Key(key) {
    return key
      .split("/")
      .map(function (part) {
        return encodeURIComponent(part);
      })
      .join("/");
  }

  function jsonResponse(body, status) {
    return new Response(JSON.stringify(body, null, 2), {
      status: status || 200,
      headers: {
        "content-type": "application/json; charset=utf-8",
        "cache-control": "no-store",
        "access-control-allow-origin": "*",
        "access-control-allow-methods": "GET, OPTIONS",
        "access-control-allow-headers": "content-type"
      }
    });
  }

  try {
    const bucket = context.env.TEASERS;

    if (!bucket) {
      return jsonResponse({
        ok: false,
        error: "Missing R2 binding named TEASERS."
      }, 500);
    }

    let cursor = undefined;
    const tracks = [];

    do {
      const listed = await bucket.list({
        cursor: cursor,
        limit: 1000
      });

      for (const object of listed.objects) {
        if (AUDIO_FILE_PATTERN.test(object.key)) {
          tracks.push(PUBLIC_R2_BASE + encodeR2Key(object.key));
        }
      }

      cursor = listed.truncated ? listed.cursor : undefined;
    } while (cursor);

    return jsonResponse({
      ok: true,
      source: "R2",
      binding: "TEASERS",
      bucket_layout: "root",
      public_base: PUBLIC_R2_BASE,
      count: tracks.length,
      tracks: tracks
    }, 200);
  } catch (error) {
    return jsonResponse({
      ok: false,
      error: "R2 teaser playlist function failed.",
      message: String(error && error.message ? error.message : error)
    }, 500);
  }
}
