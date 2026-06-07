// admin/creator_session_create.js
export async function onRequest(context) {
  const { CC_SESSION_SECRET } = context.env;

  // inning: deterministic 15‑minute slice
  const now = Date.now();
  const inning = Math.floor(now / (15 * 60 * 1000));

  // creator‑lane ball
  const ball = `cc_creator_at_bat|${inning}`;

  // umpire key
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

  // scorebook entry
  const scorebookEntry = `${ball}.${pitchSignatureHex}`;

  return new Response(
    JSON.stringify(
      {
        creator_at_bat: scorebookEntry,
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
