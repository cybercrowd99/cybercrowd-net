export async function onRequest(context) {
  const { CC_SESSION_SECRET } = context.env;
  const req = context.request;

  const token =
    req.headers.get("authorization") ||
    req.headers.get("x-session-token") ||
    null;

  if (!token) {
    return new Response(JSON.stringify({
      valid: false,
      reason: "missing_token"
    }, null, 2), {
      headers: { "Content-Type": "application/json" }
    });
  }

  const parts = token.split(".");
  if (parts.length !== 2) {
    return new Response(JSON.stringify({
      valid: false,
      reason: "malformed_token"
    }, null, 2), {
      headers: { "Content-Type": "application/json" }
    });
  }

  const [payload, signatureHex] = parts;

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(CC_SESSION_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const expectedBuffer = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(payload)
  );

  const expectedArray = Array.from(new Uint8Array(expectedBuffer));
  const expectedHex = expectedArray.map(b => b.toString(16).padStart(2, "0")).join("");

  const valid = expectedHex === signatureHex;

  let window = null;
  if (valid && payload.startsWith("cc_session|")) {
    const parts = payload.split("|");
    window = parts[1] || null;
  }

  return new Response(JSON.stringify({
    valid,
    window,
    reason: valid ? null : "signature_mismatch"
  }, null, 2), {
    headers: { "Content-Type": "application/json" }
  });
}
