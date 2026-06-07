// admin/session_create.js
export async function onRequest(context) {
  const { CC_SESSION_SECRET } = context.env;

  // current inning: 15‑minute deployment slice
  const now = Date.now();
  const inning = Math.floor(now / (15 * 60 * 1000));

  // ball in play: deterministic at‑bat descriptor
  const ball = `cc_at_bat|${inning}`;

  // umpire’s key: HMAC over the ball
  const umpireKey = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(CC_SESSION_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const pitchSignatureBuffer = await crypto.subtle.sign(
    "HMAC",
    umpireKey,
    new TextEncoder().encode(ball)
  );

  const pitchSignatureArray = Array.from(new Uint8Array(pitchSignatureBuffer));
  const pitchSignatureHex = pitchSignatureArray
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");

  // scorebook entry: what the deployment validators will replay
  const scorebookEntry = `${ball}.${pitchSignatureHex}`;

  // at‑bat token: what the caller will carry into the field
  const atBatToken = scorebookEntry;

  return new Response(
    JSON.stringify(
      {
        at_bat: atBatToken,
        inning
      },
      null,
      2
    ),
    {
      headers: { "Content-Type": "application/json" }
    }
  );
}
