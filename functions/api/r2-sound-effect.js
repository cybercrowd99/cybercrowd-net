// CYBERCROWD
//
// FILE:
// functions/api/r2-sound-effect.js
//
// BUILD LAW:
// 1 FILE
// 1 JOB
// 1 FUNCTION
//
// JOB:
// Serve the existing Sequence #1 sound effect
// from the private sound-effects R2 bucket.
//
// FUNCTION:
// onRequestGet()
//
// ROUTE:
// /api/r2-sound-effect
//
// R2 BINDING:
// SOUND_EFFECTS
//
// OBJECT KEY:
// Surface-closing_1sEffect.mp3

export async function onRequestGet(context) {
  try {
    const bucket =
      context.env.SOUND_EFFECTS;

    if (!bucket) {
      return new Response(
        "Missing R2 binding: SOUND_EFFECTS",
        {
          status: 500,
          headers: {
            "content-type":
              "text/plain; charset=utf-8",
            "cache-control":
              "no-store"
          }
        }
      );
    }

    const object =
      await bucket.get(
        "Surface-closing_1sEffect.mp3"
      );

    if (!object) {
      return new Response(
        "Sound effect not found.",
        {
          status: 404,
          headers: {
            "content-type":
              "text/plain; charset=utf-8",
            "cache-control":
              "no-store"
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
      "cache-control",
      "public, max-age=86400"
    );

    headers.set(
      "etag",
      object.httpEtag
    );

    return new Response(
      object.body,
      {
        status: 200,
        headers
      }
    );

  } catch (error) {
    return new Response(
      "Sound effect route failed.",
      {
        status: 500,
        headers: {
          "content-type":
            "text/plain; charset=utf-8",
          "cache-control":
            "no-store"
        }
      }
    );
  }
}
