// admin/session_metadata.js
export async function onRequest(context) {
  const req = context.request;
  const { CC_SESSION_SECRET } = context.env;

  // incoming at‑bat token
  const token =
    req.headers.get("authorization") ||
    req.headers.get("x-at-bat-token") ||
    null;

  if (!token) {
    return json({
      ok: false,
      reason: "missing_at_bat"
    });
  }

  const parts = token.split(".");
  if (parts.length !== 2) {
    return json({
      ok: false,
      reason: "malformed_scorebook_entry"
    });
  }

  const [ball, pitchSignatureHex] = parts;

  // ball must follow cc_at_bat|<inning>
  if (!ball.startsWith("cc_at_bat|")) {
    return json({
      ok: false,
      reason: "invalid_ball_format"
    });
  }

  const inningStr = ball.split("|")[1];
  const inning = parseInt(inningStr, 10);

  if (isNaN(inning)) {
    return json({
      ok: false,
      reason: "invalid_inning"
    });
  }

  // umpire replays the pitch
  const umpireKey = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(CC_SESSION_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const replayBuffer = await crypto.subtle.sign(
    "HMAC",
    umpireKey,
    new TextEncoder().encode(ball)
  );

  const replayArray = Array.from(new Uint8Array(replayBuffer));
  const replayHex = replayArray
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");

  const valid = timingSafeEqual(pitchSignatureHex, replayHex);

  // metadata is deterministic — no KV, no storage
  const now = Date.now();
  const inningMs = inning * 15 * 60 * 1000;
  const ageMs = now - inningMs;

  return json({
    ok: valid,
    inning,
    ageMs,
    ball,
    pitchSignatureHex,
    replayHex,
    reason: valid ? null : "signature_mismatch"
  });
}

function json(obj) {
  return new Response(JSON.stringify(obj, null, 2), {
    headers: { "Content-Type": "application/json" }
  });
}

function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) {
    r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return r === 0;
}
