export async function onRequest(context) {
  const { CC_SESSION_SECRET } = context.env;

  const now = Date.now();
  const window = Math.floor(now / (15 * 60 * 1000));

  const payload = `cc_session|${window}`;

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(CC_SESSION_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signatureBuffer = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(payload)
  );

  const signatureArray = Array.from(new Uint8Array(signatureBuffer));
  const signatureHex = signatureArray.map(b => b.toString(16).padStart(2, "0")).join("");

  const token = `${payload}.${signatureHex}`;

  return new Response(JSON.stringify({
    session: token,
    window
  }, null, 2), {
    headers: { "Content-Type": "application/json" }
  });
}
