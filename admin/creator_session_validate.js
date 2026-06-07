export async function onRequest(context) {
  const { CC_SESSION_SECRET } = context.env;

  const req = context.request;
  const headers = req.headers;

  const token =
    headers.get("authorization") ||
    headers.get("x-at-bat-token") ||
    null;

  if (!token) {
    return json({
      valid: false,
      reason: "missing_creator_at_bat"
    });
  }

  const parts = token.split(".");
  if (parts.length !== 2) {
    return json({
      valid: false,
      reason: "malformed_scorebook_entry"
    });
  }

  const [ball, pitchSignatureHex] = parts;

  if (!ball.startsWith("cc_creator_at_bat|")) {
    return json({
      valid: false,
      reason: "invalid_creator_ball_format"
    });
  }

  const segments = ball.split("|");
  const inning = parseInt(segments[1], 10);

  if (isNaN(inning)) {
    return json({
      valid: false,
      reason: "invalid_inning"
    });
  }

  const umpireKey = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(CC_SESSION_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const expectedSignatureBuffer = await crypto.subtle.sign(
    "HMAC",
    umpireKey,
    new TextEncoder().encode(ball)
  );

  const expectedSignatureArray = Array.from(
    new Uint8Array(expectedSignatureBuffer)
  );

  const expectedHex = expectedSignatureArray
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");

  const valid = expectedHex === pitchSignatureHex;

  return json({
    valid,
    inning,
    reason: valid ? "verified" : "signature_mismatch"
  });
}

function json(obj) {
  return new Response(JSON.stringify(obj, null, 2), {
    headers: { "Content-Type": "application/json" }
  });
}
